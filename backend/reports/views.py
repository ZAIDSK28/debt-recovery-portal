# reports/views.py

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
)


def build_invoice_html(invoice):
    items_rows = "".join([
        f"""<tr>
          <td>{item.description}</td>
          <td class="r">{item.quantity}</td>
          <td class="r">{item.rate}</td>
          <td class="r">{item.amount}</td>
        </tr>"""
        for item in invoice.items.all()
    ])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice {invoice.invoice_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap');

    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    body {{
      font-family: 'Jost', sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      background: #ffffff;
      padding: 64px 72px;
      max-width: 860px;
      margin: 0 auto;
      line-height: 1.5;
    }}

    .top-row {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 48px;
    }}

    .invoice-title {{
      font-size: 26px;
      font-weight: 300;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #1a1a1a;
    }}

    .logo-block {{ text-align: right; }}
    .logo-icon {{ font-size: 34px; line-height: 1; margin-bottom: 5px; }}
    .logo-name {{ font-size: 14px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #1a1a1a; }}
    .logo-sub {{ font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #999; margin-top: 2px; }}

    .sender-line {{
      font-size: 12px;
      color: #555;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }}
    .sender-line strong {{ font-weight: 600; color: #1a1a1a; }}

    .bill-row {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 36px;
    }}

    .bill-to-block .bill-label {{
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #1a1a1a;
      margin-bottom: 8px;
    }}
    .bill-to-block p {{ font-size: 13px; color: #333; line-height: 1.9; }}

    .invoice-meta-block {{ text-align: right; }}
    .meta-row {{
      display: flex;
      justify-content: flex-end;
      gap: 24px;
      margin-bottom: 5px;
      font-size: 13px;
    }}
    .meta-row .m-label {{ color: #666; }}
    .meta-row .m-value {{ font-weight: 600; color: #1a1a1a; min-width: 100px; text-align: right; }}

    .pills-row {{ display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }}
    .pill {{ border: 1px solid #ddd; padding: 3px 12px; font-size: 11px; color: #666; border-radius: 2px; }}
    .pill span {{ font-weight: 600; color: #1a1a1a; }}

    table {{ width: 100%; border-collapse: collapse; }}
    thead tr {{ border-top: 1.5px solid #1a1a1a; border-bottom: 1.5px solid #1a1a1a; }}
    thead th {{
      padding: 10px 14px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #1a1a1a;
    }}
    thead th.r {{ text-align: right; }}
    tbody tr {{ border-bottom: 1px solid #e5e5e5; }}
    tbody td {{ padding: 13px 14px; font-size: 13px; color: #222; vertical-align: top; }}
    tbody td.r {{ text-align: right; }}

    .totals-section {{ display: flex; justify-content: flex-end; }}
    .totals-block {{ width: 340px; }}
    .totals-line {{
      display: flex;
      justify-content: space-between;
      padding: 9px 14px;
      font-size: 13px;
      border-bottom: 1px solid #e5e5e5;
    }}
    .totals-line.top-border {{ border-top: 1.5px solid #1a1a1a; }}
    .totals-line .tl-label {{ color: #666; }}
    .totals-line .tl-value {{ font-weight: 500; }}
    .totals-line.grand {{
      background: #1a1a1a;
      color: #fff;
      border-bottom: none;
      padding: 11px 14px;
    }}
    .totals-line.grand .tl-label {{
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      align-self: center;
    }}
    .totals-line.grand .tl-value {{ color: #fff; font-size: 14px; font-weight: 600; }}

    .signature-block {{ text-align: right; margin-top: 44px; }}
    .sig-label {{ font-size: 11px; color: #888; margin-bottom: 4px; font-style: italic; }}
    .sig-name {{ font-family: 'EB Garamond', serif; font-style: italic; font-size: 28px; color: #1a1a1a; }}

    .footer-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 44px; }}
    .footer-block .fb-label {{
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 6px;
    }}
    .footer-block p {{ font-size: 12px; color: #555; line-height: 1.7; }}

    .page-footer {{
      margin-top: 60px;
      padding-top: 14px;
      border-top: 1px solid #ddd;
      font-size: 11px;
      color: #666;
    }}
    .page-footer strong {{ color: #1a1a1a; }}
  </style>
</head>
<body>

  <div class="top-row">
    <div class="invoice-title">Tax Invoice</div>
    <div class="logo-block">
      <div class="logo-icon">&#8962;</div>
      <div class="logo-name">Your Company</div>
      <div class="logo-sub">Distribution &amp; Supply</div>
    </div>
  </div>

  <div class="sender-line">
    <strong>Your Company Name</strong>, 123 Business Park, Hyderabad 500001, India
  </div>

  <div class="bill-row">
    <div class="bill-to-block">
      <div class="bill-label">Bill To</div>
      <p>
        <strong>{invoice.customer_name}</strong><br />
        {invoice.customer_address}<br />
        {invoice.customer_phone}<br />
        GST: {invoice.gst_number}
      </p>
    </div>
    <div class="invoice-meta-block">
      <div class="meta-row">
        <span class="m-label">Invoice No.:</span>
        <span class="m-value">{invoice.invoice_number}</span>
      </div>
      <div class="meta-row">
        <span class="m-label">Invoice Date:</span>
        <span class="m-value">{invoice.invoice_date}</span>
      </div>
    </div>
  </div>

  <div class="pills-row">
    <div class="pill">Route: <span>{invoice.route_name}</span></div>
    <div class="pill">Outlet: <span>{invoice.outlet_name}</span></div>
    <div class="pill">Brand: <span>{invoice.brand}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:48%">Description</th>
        <th class="r">Quantity</th>
        <th class="r">Unit Price</th>
        <th class="r">Amount</th>
      </tr>
    </thead>
    <tbody>
      {items_rows}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="totals-block">
      <div class="totals-line top-border">
        <span class="tl-label">Subtotal</span>
        <span class="tl-value">{invoice.subtotal}</span>
      </div>
      <div class="totals-line">
        <span class="tl-label">Tax</span>
        <span class="tl-value">{invoice.tax_amount}</span>
      </div>
      <div class="totals-line">
        <span class="tl-label">Discount</span>
        <span class="tl-value">- {invoice.discount_amount}</span>
      </div>
      <div class="totals-line grand">
        <span class="tl-label">Total Due</span>
        <span class="tl-value">{invoice.total_amount}</span>
      </div>
    </div>
  </div>

  <div class="signature-block">
    <div class="sig-label">Issued by, signature:</div>
    <div class="sig-name">Your Company Name</div>
  </div>

  <div class="footer-grid">
    <div class="footer-block">
      <div class="fb-label">Notes</div>
      <p>{invoice.notes}</p>
    </div>
    <div class="footer-block">
      <div class="fb-label">Terms &amp; Conditions</div>
      <p>{invoice.terms}</p>
    </div>
  </div>

  <div class="page-footer">
    <strong>Your Company Name</strong>, 123 Business Park, Hyderabad 500001, India
    &nbsp;&nbsp;<strong>Email:</strong> contact@yourcompany.com
  </div>

</body>
</html>"""


class PrintableInvoiceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    queryset = PrintableInvoice.objects.all().select_related("linked_bill").prefetch_related("items")
    ordering_fields = ["created_at", "invoice_date", "invoice_number", "total_amount"]
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
                "linked_bill_id": invoice.linked_bill_id,
            },
        )

        response_serializer = PrintableInvoiceDetailSerializer(invoice)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class PrintableInvoiceRetrieveView(generics.RetrieveAPIView):
    permission_classes = [IsAdmin]
    queryset = PrintableInvoice.objects.all().select_related("linked_bill").prefetch_related("items")
    serializer_class = PrintableInvoiceDetailSerializer


class PrintableInvoicePrintView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk, *args, **kwargs):
        invoice = get_object_or_404(
            PrintableInvoice.objects.prefetch_related("items"),
            pk=pk,
        )
        html = build_invoice_html(invoice)
        return HttpResponse(html, content_type="text/html; charset=utf-8")


class PrintableInvoicePDFView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk, *args, **kwargs):
        invoice = get_object_or_404(
            PrintableInvoice.objects.prefetch_related("items"),
            pk=pk,
        )
        html = build_invoice_html(invoice)

        pdf_bytes = HTML(string=html, base_url=request.build_absolute_uri("/")).write_pdf()

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{invoice.invoice_number}.pdf"'
        return response