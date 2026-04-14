from __future__ import annotations

import io
from datetime import timedelta

import pandas as pd
from django.db.models import DecimalField, Sum, Value
from django.db.models.functions import Coalesce, TruncDate
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, views
from rest_framework.response import Response

from bills.models import Bill
from core.permissions import IsAdmin, IsDRA
from core.utils import create_audit_log
from payments.models import Payment
from payments.serializers import (
    DailySummarySerializer,
    PaymentCreateSerializer,
    PaymentSerializer,
    PaymentStatusUpdateSerializer,
    TodayTotalsSerializer,
)


def format_export_datetime(value):
    if value is None:
        return ""
    if timezone.is_aware(value):
        value = timezone.localtime(value)
    return value.strftime("%Y-%m-%d %H:%M:%S")


class RecordPaymentView(generics.CreateAPIView):
    permission_classes = [IsDRA]
    serializer_class = PaymentCreateSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        bill = get_object_or_404(Bill, id=self.kwargs["bill_id"], assigned_to=self.request.user, status=Bill.Status.OPEN)
        context["bill"] = bill
        return context

    def perform_create(self, serializer):
        payment = serializer.save()
        create_audit_log(
            actor=self.request.user,
            action="payment.recorded",
            entity_type="payment",
            entity_id=str(payment.id),
            metadata={
                "bill_id": payment.bill_id,
                "invoice_number": payment.bill.invoice_number,
                "payment_method": payment.payment_method,
                "amount": str(payment.amount),
            },
        )


class AllPaymentsView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = PaymentSerializer
    queryset = Payment.objects.select_related("bill").all()
    ordering_fields = ["created_at", "amount"]
    search_fields = ["bill__invoice_number", "dra_username", "transaction_number", "cheque_number"]

    def get_queryset(self):
        queryset = super().get_queryset()
        payment_method = self.request.query_params.get("payment_method")
        payment_method_in = self.request.query_params.get("payment_method_in")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)

        if payment_method_in:
            methods = [item.strip() for item in payment_method_in.split(",") if item.strip()]
            if methods:
                queryset = queryset.filter(payment_method__in=methods)

        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)

        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        return queryset


class PaymentUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = PaymentStatusUpdateSerializer
    queryset = Payment.objects.select_related("bill").all()

    def perform_update(self, serializer):
        original = self.get_object()
        old_status = original.cheque_status
        payment = serializer.save()
        create_audit_log(
            actor=self.request.user,
            action="payment.status_updated",
            entity_type="payment",
            entity_id=str(payment.id),
            metadata={
                "bill_id": payment.bill_id,
                "invoice_number": payment.bill.invoice_number,
                "old_status": old_status,
                "new_status": payment.cheque_status,
            },
        )


class TodayTotalsView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        today = timezone.localdate()
        totals = self._compute_totals(today, today)
        serializer = TodayTotalsSerializer(totals)
        return Response(serializer.data)

    def _compute_totals(self, start_date, end_date):
        base = Payment.objects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
        amount_field = DecimalField(max_digits=12, decimal_places=2)

        def total_for(method, cleared_only=False):
            queryset = base.filter(payment_method=method)
            if cleared_only:
                queryset = queryset.filter(cheque_status=Payment.ChequeStatus.CLEARED)
            return queryset.aggregate(
                total=Coalesce(Sum("amount"), Value(0), output_field=amount_field)
            )["total"]

        return {
            "cash_total": total_for(Payment.PaymentMethod.CASH),
            "upi_total": total_for(Payment.PaymentMethod.UPI),
            "cheque_total": total_for(Payment.PaymentMethod.CHEQUE, cleared_only=True),
            "electronic_total": total_for(Payment.PaymentMethod.ELECTRONIC, cleared_only=True),
        }


class DailySummaryView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        days = int(request.query_params.get("days", 30))
        end_date = timezone.localdate()
        start_date = end_date - timedelta(days=days - 1)

        amount_field = DecimalField(max_digits=12, decimal_places=2)

        payments = (
            Payment.objects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
            .annotate(day=TruncDate("created_at"))
            .values("day", "payment_method", "cheque_status")
            .annotate(
                total=Coalesce(
                    Sum("amount"),
                    Value(0),
                    output_field=amount_field,
                )
            )
            .order_by("day")
        )

        summary_map: dict = {}
        current = start_date
        while current <= end_date:
            summary_map[current] = {
                "date": current,
                "cash_total": "0.00",
                "upi_total": "0.00",
                "cheque_total": "0.00",
                "electronic_total": "0.00",
            }
            current += timedelta(days=1)

        for row in payments:
            day = row["day"]
            method = row["payment_method"]
            cheque_status = row["cheque_status"]
            total = row["total"]

            if method == Payment.PaymentMethod.CASH:
                summary_map[day]["cash_total"] = total
            elif method == Payment.PaymentMethod.UPI:
                summary_map[day]["upi_total"] = total
            elif method == Payment.PaymentMethod.CHEQUE and cheque_status == Payment.ChequeStatus.CLEARED:
                summary_map[day]["cheque_total"] = total
            elif method == Payment.PaymentMethod.ELECTRONIC and cheque_status == Payment.ChequeStatus.CLEARED:
                summary_map[day]["electronic_total"] = total

        data = [summary_map[day] for day in sorted(summary_map.keys())]
        serializer = DailySummarySerializer(data, many=True)
        return Response(serializer.data)


class ExportPaymentsView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        queryset = Payment.objects.select_related("bill").all()
        payment_method = request.query_params.get("payment_method")
        payment_method_in = request.query_params.get("payment_method_in")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)

        if payment_method_in:
            methods = [item.strip() for item in payment_method_in.split(",") if item.strip()]
            if methods:
                queryset = queryset.filter(payment_method__in=methods)

        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)

        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        rows = []
        for payment in queryset:
            rows.append(
                {
                    "Payment ID": payment.id,
                    "Bill Invoice Number": payment.bill.invoice_number,
                    "DRA Username": payment.dra_username,
                    "Payment Method": payment.payment_method,
                    "Amount": float(payment.amount),
                    "Transaction Number": payment.transaction_number,
                    "Cheque Number": payment.cheque_number,
                    "Cheque Date": payment.cheque_date.strftime("%Y-%m-%d") if payment.cheque_date else "",
                    "Cheque Type": payment.cheque_type,
                    "Cheque Status": payment.cheque_status,
                    "Firm": payment.firm,
                    "Created At": format_export_datetime(payment.created_at),
                }
            )

        df = pd.DataFrame(rows)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Payments")

        output.seek(0)
        response = HttpResponse(
            output.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="payments_export.xlsx"'
        return response