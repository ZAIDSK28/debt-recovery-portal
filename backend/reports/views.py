# reports/views.py

from __future__ import annotations

import logging
from decimal import Decimal
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
    items = list(invoice.items.all())

    customer_lines = [
        invoice.customer_name or "",
        invoice.customer_address or "",
        invoice.customer_phone or "",
    ]
    customer_lines = [line for line in customer_lines if str(line).strip()]

    notes_text = invoice.notes or "Add a message here for your customer."
    terms_text = invoice.terms or "Enter a brief description about your job or project."

    items_rows = "".join(
        [
            f"""
            <tr>
              <td class="item-col">
                <div class="item-name">{escape(str(item.description or ""))}</div>
                <div class="item-sub">Product item</div>
              </td>
              <td class="qty-col">{escape(str(item.quantity))}</td>
              <td class="price-col">{_fmt_money(item.rate)}</td>
              <td class="amount-col">{_fmt_money(item.line_total)}</td>
            </tr>
            """
            for item in items
        ]
    )

    if not items_rows:
        items_rows = """
        <tr>
          <td class="item-col">
            <div class="item-name">No items</div>
            <div class="item-sub">No invoice items available</div>
          </td>
          <td class="qty-col">0</td>
          <td class="price-col">₹0.00</td>
          <td class="amount-col">₹0.00</td>
        </tr>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice {escape(str(invoice.invoice_number))}</title>
  <style>
    @page {{
      size: A4;
      margin: 24mm 18mm 20mm 18mm;
    }}

    body {{
      font-family: Arial, Helvetica, sans-serif;
      color: #222;
      font-size: 14px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
      background: #fff;
    }}

    .invoice-wrapper {{
      width: 100%;
    }}

    .top-header {{
      display: table;
      width: 100%;
      margin-bottom: 28px;
    }}

    .top-left,
    .top-right {{
      display: table-cell;
      vertical-align: top;
      width: 50%;
    }}

    .brand-block {{
      display: table;
    }}

    .logo-box {{
      width: 72px;
      height: 72px;
      background: #5f6f82;
      border-radius: 14px;
      display: table-cell;
      vertical-align: middle;
      text-align: center;
      color: #fff;
      font-size: 30px;
      font-weight: bold;
    }}

    .brand-text {{
      display: table-cell;
      vertical-align: top;
      padding-left: 16px;
    }}

    .brand-name {{
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #1d1d1f;
    }}

    .brand-address {{
      margin: 0;
      color: #444;
      white-space: pre-line;
    }}

    .top-right {{
      text-align: right;
    }}

    .invoice-meta {{
      font-size: 14px;
      color: #222;
      line-height: 1.7;
    }}

    .invoice-meta strong {{
      display: inline-block;
      min-width: 100px;
    }}

    .thick-rule {{
      height: 8px;
      background: #5f6f82;
      margin: 12px 0 42px;
    }}

    .hero-title {{
      font-size: 34px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #1d1d1f;
    }}

    .hero-text {{
      margin: 0 0 54px 0;
      font-size: 16px;
      color: #333;
    }}

    .info-grid {{
      display: table;
      width: 100%;
      table-layout: fixed;
      margin-bottom: 26px;
    }}

    .info-col {{
      display: table-cell;
      vertical-align: top;
      width: 33.33%;
      padding-right: 22px;
    }}

    .info-col:last-child {{
      padding-right: 0;
    }}

    .info-rule {{
      border-top: 1px solid #d8d8d8;
      margin-bottom: 18px;
    }}

    .section-label {{
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.6px;
      color: #111;
      margin-bottom: 10px;
    }}

    .section-content {{
      color: #222;
      font-size: 15px;
      white-space: pre-line;
    }}

    table.items-table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }}

    .items-table thead th {{
      text-align: left;
      font-size: 12px;
      letter-spacing: 1.6px;
      color: #111;
      padding: 12px 0;
      border-top: 1px solid #d8d8d8;
      border-bottom: 1px solid #d8d8d8;
    }}

    .items-table td {{
      padding: 18px 0;
      border-bottom: 1px solid #e2e2e2;
      vertical-align: top;
      font-size: 15px;
    }}

    .item-col {{
      width: 58%;
    }}

    .qty-col,
    .price-col,
    .amount-col {{
      width: 14%;
      text-align: right;
    }}

    .item-name {{
      font-size: 15px;
      color: #222;
      margin-bottom: 4px;
    }}

    .item-sub {{
      color: #9a9a9a;
      font-size: 13px;
    }}

    .totals {{
      width: 100%;
      margin-top: 26px;
      border-top: 1px solid #d8d8d8;
      padding-top: 18px;
    }}

    .totals-table {{
      width: 100%;
      border-collapse: collapse;
    }}

    .totals-table td {{
      padding: 6px 0;
      font-size: 15px;
    }}

    .totals-table .label {{
      text-align: left;
      color: #222;
    }}

    .totals-table .value {{
      text-align: right;
      color: #222;
      width: 180px;
    }}

    .grand-total-row td {{
      padding-top: 16px;
      font-size: 18px;
      font-weight: 700;
      border-top: 1px solid #d8d8d8;
    }}

    .bottom-rule {{
      border-top: 1px solid #d8d8d8;
      margin-top: 14px;
    }}

    .footer {{
      margin-top: 120px;
      display: table;
      width: 100%;
      color: #444;
      font-size: 12px;
    }}

    .footer-left,
    .footer-right {{
      display: table-cell;
      vertical-align: bottom;
      width: 50%;
    }}

    .footer-right {{
      text-align: right;
    }}
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <div class="top-header">
      <div class="top-left">
        <div class="brand-block">
          <div class="logo-box">🏪</div>
          <div class="brand-text">
            <div class="brand-name">{escape(invoice.brand or "Business Name")}</div>
            <p class="brand-address">{escape(invoice.outlet_name or "")}
{escape(invoice.route_name or "")}
India</p>
          </div>
        </div>
      </div>
      <div class="top-right">
        <div class="invoice-meta">
          <div><strong>Invoice#</strong> {escape(str(invoice.invoice_number))}</div>
          <div><strong>Issue date</strong> {_fmt_date(invoice.invoice_date)}</div>
        </div>
      </div>
    </div>

    <div class="thick-rule"></div>

    <h1 class="hero-title">{escape(invoice.brand or "Business name")}</h1>
    <p class="hero-text">{escape(notes_text)}</p>

    <div class="info-grid">
      <div class="info-col">
        <div class="info-rule"></div>
        <div class="section-label">BILL TO</div>
        <div class="section-content">{escape(chr(10).join(customer_lines) if customer_lines else "Customer details not provided")}</div>
      </div>

      <div class="info-col">
        <div class="info-rule"></div>
        <div class="section-label">DETAILS</div>
        <div class="section-content">{escape(terms_text)}</div>
      </div>

      <div class="info-col">
        <div class="info-rule"></div>
        <div class="section-label">PAYMENT</div>
        <div class="section-content">Due date {_fmt_date(invoice.invoice_date)}
{_fmt_money(invoice.total_amount)}</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>ITEM</th>
          <th class="qty-col">QTY</th>
          <th class="price-col">PRICE</th>
          <th class="amount-col">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        {items_rows}
      </tbody>
    </table>

    <div class="totals">
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
        <tr class="grand-total-row">
          <td class="label">Total Due</td>
          <td class="value">{_fmt_money(invoice.total_amount)}</td>
        </tr>
      </table>
      <div class="bottom-rule"></div>
    </div>

    <div class="footer">
      <div class="footer-left">
        Thank you for your business.
      </div>
      <div class="footer-right">
        Page 1
      </div>
    </div>
  </div>
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