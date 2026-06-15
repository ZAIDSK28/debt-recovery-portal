# reports/views.py

from __future__ import annotations

import logging
from decimal import Decimal
from html import escape

from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, views
from rest_framework.response import Response

from core.permissions import IsAdmin
from core.utils import create_audit_log
from reports.models import InvoiceSequenceSetting, Party, PrintableInvoice
from reports.serializers import (
    InvoiceSequenceSettingSerializer,
    PartySerializer,
    PrintableInvoiceCreateSerializer,
    PrintableInvoiceDetailSerializer,
    PrintableInvoiceListSerializer,
    PrintableInvoiceUpdateSerializer,
)

logger = logging.getLogger(__name__)


def _fmt_money(value) -> str:
    try:
        amount = Decimal(str(value or "0"))
    except Exception:
        amount = Decimal("0.00")
    return f"₹{amount:.2f}"


def _fmt_date(value) -> str:
    if not value:
        return ""
    return value.strftime("%d/%m/%Y")


def build_invoice_html(invoice):
    from html import escape

    items = list(invoice.items.all())

    customer_lines = [
        invoice.customer_name,
        invoice.customer_address,
        invoice.customer_phone,
    ]

    if invoice.gst_number:
        customer_lines.append(f"GST: {invoice.gst_number}")

    customer_lines = [str(x).strip() for x in customer_lines if str(x).strip()]

    bill_to_html = "<br>".join(escape(x) for x in customer_lines) if customer_lines else "—"

    if items:
        items_rows = "".join(
            f"""
            <tr>
                <td>{escape(str(item.description or ""))}</td>
                <td class="num">{escape(str(item.quantity))}</td>
                <td class="num">{_fmt_money(item.rate)}</td>
                <td class="num">{_fmt_money(item.line_total)}</td>
            </tr>
            """
            for item in items
        )
    else:
        items_rows = """
        <tr>
            <td>No items</td>
            <td class="num">0</td>
            <td class="num">₹0.00</td>
            <td class="num">₹0.00</td>
        </tr>
        """

    notes_text = escape(invoice.notes) if invoice.notes else ""
    terms_text = escape(invoice.terms) if invoice.terms else ""

    return f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<title>Invoice</title>

<style>
@page {{
    size: A4;
    margin: 12mm;
}}

* {{
    box-sizing: border-box;
}}

body {{
    margin: 0;
    background: #fff;
    color: #111827;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    line-height: 1.5;
}}

.invoice {{
    width: 100%;
}}

.header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 12px;
    margin-bottom: 20px;
}}

.invoice-title {{
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 6px;
}}

.invoice-meta {{
    font-size: 13px;
    color: #4b5563;
}}

.bill-to {{
    text-align: right;
    max-width: 320px;
}}

.bill-to-title {{
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 6px;
}}

.bill-to-content {{
    font-size: 13px;
    line-height: 1.6;
}}

.items-table {{
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}}

.items-table th {{
    border: 1px solid #d1d5db;
    background: #f8fafc;
    padding: 10px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
}}

.items-table td {{
    border: 1px solid #d1d5db;
    padding: 10px;
    font-size: 13px;
}}

.items-table .num {{
    text-align: right;
}}

.totals-wrapper {{
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
}}

.totals-table {{
    width: 320px;
    border-collapse: collapse;
}}

.totals-table td {{
    border: 1px solid #d1d5db;
    padding: 10px;
    font-size: 13px;
}}

.totals-table .label {{
    font-weight: 500;
}}

.totals-table .value {{
    text-align: right;
}}

.grand-total td {{
    font-weight: 700;
    font-size: 14px;
    background: #f8fafc;
}}

.footer {{
    margin-top: 24px;
    border-top: 1px solid #d1d5db;
    padding-top: 12px;
    font-size: 12px;
    color: #4b5563;
}}

.footer-section {{
    margin-bottom: 8px;
}}

.footer strong {{
    color: #111827;
}}

.thank-you {{
    margin-top: 12px;
}}

@media print {{
    body {{
        margin: 0;
    }}
}}

@media (max-width: 640px) {{
    .header {{
        flex-direction: column;
        gap: 16px;
    }}

    .bill-to {{
        text-align: left;
    }}

    .totals-wrapper {{
        justify-content: flex-start;
    }}

    .totals-table {{
        width: 100%;
    }}
}}
</style>
</head>

<body>

<div class="invoice">

    <div class="header">

        <div>
            <div class="invoice-title">Invoice</div>

            <div class="invoice-meta">
                <div><strong>No:</strong> {escape(str(invoice.invoice_number))}</div>
                <div><strong>Date:</strong> {_fmt_date(invoice.invoice_date)}</div>
            </div>
        </div>

        <div class="bill-to">
            <div class="bill-to-title">Bill To</div>

            <div class="bill-to-content">
                {bill_to_html}
            </div>
        </div>

    </div>

    <table class="items-table">

        <thead>
            <tr>
                <th style="width:55%;">Description</th>
                <th style="width:10%; text-align:right;">Qty</th>
                <th style="width:17%; text-align:right;">Rate</th>
                <th style="width:18%; text-align:right;">Amount</th>
            </tr>
        </thead>

        <tbody>
            {items_rows}
        </tbody>

    </table>

    <div class="totals-wrapper">

        <table class="totals-table">

            <tr>
                <td class="label">Subtotal</td>
                <td class="value">{_fmt_money(invoice.subtotal)}</td>
            </tr>

            <tr>
                <td class="label">Tax</td>
                <td class="value">{_fmt_money(invoice.tax_amount)}</td>
            </tr>

            <tr>
                <td class="label">Discount</td>
                <td class="value">{_fmt_money(invoice.discount_amount)}</td>
            </tr>

            <tr class="grand-total">
                <td>Total Due</td>
                <td class="value">{_fmt_money(invoice.total_amount)}</td>
            </tr>

        </table>

    </div>

    <div class="footer">

        {f'<div class="footer-section"><strong>Notes:</strong> {notes_text}</div>' if notes_text else ''}

        {f'<div class="footer-section"><strong>Terms:</strong> {terms_text}</div>' if terms_text else ''}

        <div class="thank-you">
            Thank you for your business.
        </div>

    </div>

</div>

</body>
</html>
"""


class PartyListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = PartySerializer
    queryset = Party.objects.all()
    ordering_fields = ["id", "name", "created_at"]
    search_fields = ["name", "phone", "email", "gst_number"]


class PartyRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = PartySerializer
    queryset = Party.objects.all()


class InvoiceSequenceSettingView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = InvoiceSequenceSettingSerializer
    queryset = InvoiceSequenceSetting.objects.all()

    def get_object(self):
        return InvoiceSequenceSetting.get_active()


class PrintableInvoiceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    queryset = PrintableInvoice.objects.all().select_related("recovery_bill", "party").prefetch_related("items__product")
    ordering_fields = ["created_at", "updated_at", "invoice_date", "invoice_number", "total_amount"]
    search_fields = ["invoice_number", "customer_name", "route_name", "outlet_name", "brand"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PrintableInvoiceCreateSerializer
        return PrintableInvoiceListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            queryset = queryset.filter(invoice_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(invoice_date__lte=end_date)
        return queryset

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
                "party_id": invoice.party_id,
            },
        )

        response_serializer = PrintableInvoiceDetailSerializer(invoice)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class PrintableInvoiceRetrieveView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    queryset = PrintableInvoice.objects.all().select_related("recovery_bill", "party").prefetch_related("items__product")

    def get_serializer_class(self):
        if self.request.method in ["PATCH", "PUT"]:
            return PrintableInvoiceUpdateSerializer
        return PrintableInvoiceDetailSerializer

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Http404:
            return Response(status=status.HTTP_204_NO_CONTENT)


class PrintableInvoicePrintView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk, *args, **kwargs):
        invoice = get_object_or_404(
            PrintableInvoice.objects.select_related("party").prefetch_related("items__product"),
            pk=pk,
        )
        html = build_invoice_html(invoice)
        return HttpResponse(html, content_type="text/html; charset=utf-8")


class PrintableInvoicePDFView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk, *args, **kwargs):
        invoice = get_object_or_404(
            PrintableInvoice.objects.select_related("party").prefetch_related("items__product"),
            pk=pk,
        )
        try:
            from weasyprint import HTML

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