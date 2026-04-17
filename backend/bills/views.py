# bills/views.py

from __future__ import annotations

import threading

from drf_spectacular.utils import extend_schema
from rest_framework import generics, parsers, permissions, status, views
from rest_framework.response import Response

from bills.filters import BillFilterSet
from bills.models import Bill, BillImportJob, Outlet, Route
from bills.serializers import (
    AssignBillsSerializer,
    BillCreateUpdateSerializer,
    BillImportJobStatusSerializer,
    BillSerializer,
    OutletSerializer,
    RouteSerializer,
)
from bills.utils import build_bills_export_response, import_bills_from_excel
from core.permissions import IsAdmin, IsDRA
from core.utils import create_audit_log


class BillListCreateView(generics.ListCreateAPIView):
    filterset_class = BillFilterSet
    ordering_fields = ["id", "invoice_number", "invoice_date", "actual_amount", "remaining_amount", "overdue_days", "created_at"]
    search_fields = ["invoice_number"]
    queryset = Bill.objects.select_related("outlet__route", "assigned_to").all()

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return BillCreateUpdateSerializer
        return BillSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(invoice_number__icontains=search)

        if user.role == "dra":
            queryset = queryset.filter(assigned_to=user, status=Bill.Status.OPEN)

        return queryset

    def perform_create(self, serializer):
        bill = serializer.save()
        create_audit_log(
            actor=self.request.user,
            action="bill.created",
            entity_type="bill",
            entity_id=str(bill.id),
            metadata={"invoice_number": bill.invoice_number},
        )


class BillRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Bill.objects.select_related("outlet__route", "assigned_to").all()

    def get_permissions(self):
        if self.request.method in ["PATCH", "DELETE"]:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return BillCreateUpdateSerializer
        return BillSerializer

    def perform_update(self, serializer):
        bill = serializer.save()

        from payments.services import reconcile_bill_from_payments
        reconcile_bill_from_payments(bill)

        create_audit_log(
            actor=self.request.user,
            action="bill.updated",
            entity_type="bill",
            entity_id=str(bill.id),
            metadata={"invoice_number": bill.invoice_number},
        )

    def perform_destroy(self, instance):
        create_audit_log(
            actor=self.request.user,
            action="bill.deleted",
            entity_type="bill",
            entity_id=str(instance.id),
            metadata={"invoice_number": instance.invoice_number},
        )
        instance.delete()


class AssignBillsView(views.APIView):
    permission_classes = [IsAdmin]

    @extend_schema(request=AssignBillsSerializer, responses={200: BillSerializer(many=True)})
    def post(self, request, *args, **kwargs):
        serializer = AssignBillsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        bill_ids = serializer.validated_data["bill_ids"]
        assigned_to = serializer.validated_data.get("assigned_to")

        bills = list(Bill.objects.filter(id__in=bill_ids))
        for bill in bills:
            old_assignee = bill.assigned_to_id
            bill.assigned_to = assigned_to
            bill.save(update_fields=["assigned_to", "overdue_days", "status", "cleared_at"])
            create_audit_log(
                actor=request.user,
                action="bill.assigned",
                entity_type="bill",
                entity_id=str(bill.id),
                metadata={
                    "invoice_number": bill.invoice_number,
                    "old_assigned_to": old_assignee,
                    "new_assigned_to": assigned_to.id if assigned_to else None,
                },
            )

        refreshed = Bill.objects.filter(id__in=bill_ids).select_related("outlet__route", "assigned_to")
        return Response(BillSerializer(refreshed, many=True).data, status=status.HTTP_200_OK)


class RouteListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RouteSerializer
    queryset = Route.objects.all()
    pagination_class = None


class OutletListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OutletSerializer
    queryset = Outlet.objects.select_related("route").all()
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        route_id = self.request.query_params.get("route_id")
        if route_id:
            queryset = queryset.filter(route_id=route_id)
        return queryset


class ExportBillsView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        queryset = Bill.objects.all()

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            queryset = queryset.filter(invoice_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(invoice_date__lte=end_date)

        return build_bills_export_response(queryset)


def _run_import_job(job_id: int, file_bytes: bytes):
    from io import BytesIO

    job = BillImportJob.objects.get(id=job_id)
    try:
        result = import_bills_from_excel(BytesIO(file_bytes), job=job)
        create_audit_log(
            actor=job.created_by,
            action="bill.imported",
            entity_type="bill_import",
            entity_id=str(job.id),
            metadata=result,
        )
    except Exception as exc:
        job.status = BillImportJob.Status.FAILED
        job.errors = [{"row": None, "message": str(exc)}]
        job.error_count = 1
        from django.utils import timezone
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "errors", "error_count", "completed_at"])


class ImportBillsView(views.APIView):
    permission_classes = [IsAdmin]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "File is required."}, status=status.HTTP_400_BAD_REQUEST)

        job = BillImportJob.objects.create(created_by=request.user)

        file_bytes = file.read()
        thread = threading.Thread(target=_run_import_job, args=(job.id, file_bytes), daemon=True)
        thread.start()

        return Response(
            {
                "imported": 0,
                "errors": [],
                "job_id": job.id,
            },
            status=status.HTTP_200_OK,
        )


class BillImportStatusView(generics.RetrieveAPIView):
    permission_classes = [IsAdmin]
    serializer_class = BillImportJobStatusSerializer
    queryset = BillImportJob.objects.all()


class MyAssignmentsFlatView(generics.ListAPIView):
    permission_classes = [IsDRA]
    serializer_class = BillSerializer
    ordering_fields = ["invoice_date", "invoice_number", "overdue_days", "actual_amount", "remaining_amount"]
    queryset = Bill.objects.select_related("outlet__route", "assigned_to").all()

    def get_queryset(self):
        queryset = super().get_queryset().filter(assigned_to=self.request.user, status=Bill.Status.OPEN)
        search = self.request.query_params.get("search", "").strip()
        mode = self.request.query_params.get("mode", "invoice_number").strip()

        if search:
            if mode == "route_name":
                queryset = queryset.filter(outlet__route__name__icontains=search)
            elif mode == "outlet_name":
                queryset = queryset.filter(outlet__name__icontains=search)
            else:
                queryset = queryset.filter(invoice_number__icontains=search)

        return queryset