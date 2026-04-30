# reports/views.py

from __future__ import annotations

import logging
from html import escape

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, views
from rest_framework.response import Response
from weasyprint import HTML

from core.permissions import IsAdmin
from core.utils import create_audit_log
from reports.models import PrintableInvoice
from reports.serializers import (
    PrintableInvoiceCreateSerializer,
    PrintableInvoiceDetailSerializer,
    PrintableInvoiceListSerializer,
    PrintableInvoiceUpdateSerializer,
)

logger = logging.getLogger(__name__)


def build_invoice_html(invoice):
    items_rows = "".join(
        [
            f"""<tr>
          <td>{escape(str(item.description or ""))}</td>
          <td class="r">{escape(str(item.quantity))}</td>
          <td class="r">{escape(str(item.rate))}</td>
          <td class="r">{escape(str(item.amount))}</td>
        </tr>"""
            for item in invoice.items.all()
        ]
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice {escape(str(invoice.invoice_number))}</title>
</head>
<body>
  <h1>Invoice {escape(str(invoice.invoice_number))}</h1>
  <div>{items_rows}</div>
</body>
</html>"""


class PrintableInvoiceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    queryset = PrintableInvoice.objects.all().select_related("recovery_bill").prefetch_related("items__product")
    ordering_fields = ["created_at", "updated_at", "invoice_date", "invoice_number", "total_amount"]
    search_fields = ["invoice_number", "customer_name", "route_name", "outlet_name", "brand"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PrintableInvoiceCreateSerializer
        return PrintableInvoiceListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = serializer.save()

        create_audit_log(
            actor=self.request.user,
            action="printable_invoice.created",
            entity_type="printable_invoice",
            entity_id=str(invoice.id),
            metadata={
                "invoice_number": invoice.invoice_number,
                "creation_mode": invoice.creation_mode,
                "linked_bill_id": getattr(getattr(invoice, "recovery_bill", None), "id", None),
            },
        )

        response_serializer = PrintableInvoiceDetailSerializer(invoice)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class PrintableInvoiceRetrieveView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    queryset = PrintableInvoice.objects.all().select_related("recovery_bill").prefetch_related("items__product")

    def get_serializer_class(self):
        if self.request.method in ["PATCH", "PUT"]:
            return PrintableInvoiceUpdateSerializer
        return PrintableInvoiceDetailSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", request.method == "PATCH")
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        invoice = serializer.save()

        create_audit_log(
            actor=self.request.user,
            action="printable_invoice.updated",
            entity_type="printable_invoice",
            entity_id=str(invoice.id),
            metadata={
                "invoice_number": invoice.invoice_number,
                "linked_bill_id": getattr(getattr(invoice, "recovery_bill", None), "id", None),
            },
        )

        response_serializer = PrintableInvoiceDetailSerializer(invoice)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def perform_destroy(self, instance):
        recovery_bill = getattr(instance, "recovery_bill", None)

        create_audit_log(
            actor=self.request.user,
            action="printable_invoice.deleted",
            entity_type="printable_invoice",
            entity_id=str(instance.id),
            metadata={
                "invoice_number": instance.invoice_number,
                "linked_bill_id": getattr(recovery_bill, "id", None),
                "had_payments": bool(recovery_bill and recovery_bill.payments.exists()),
            },
        )

        if recovery_bill:
            recovery_bill.delete()

        instance.delete()


class PrintableInvoicePrintView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk, *args, **kwargs):
        invoice = get_object_or_404(
            PrintableInvoice.objects.prefetch_related("items__product"),
            pk=pk,
        )
        html = build_invoice_html(invoice)
        return HttpResponse(html, content_type="text/html; charset=utf-8")


class PrintableInvoicePDFView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk, *args, **kwargs):
        invoice = get_object_or_404(
            PrintableInvoice.objects.prefetch_related("items__product"),
            pk=pk,
        )
        try:
            html = build_invoice_html(invoice)
            pdf_bytes = HTML(string=html, base_url=request.build_absolute_uri("/")).write_pdf()
        except Exception as exc:
            logger.exception(
                "Printable invoice PDF generation failed",
                extra={"invoice_id": invoice.id},
                exc_info=exc,
            )
            raise

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{invoice.invoice_number}.pdf"'
        return response