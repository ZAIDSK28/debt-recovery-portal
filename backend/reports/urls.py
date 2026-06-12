# reports/urls.py

from django.urls import path

from reports.views import (
    InvoiceSequenceSettingView,
    PartyListCreateView,
    PartyRetrieveUpdateView,
    PrintableInvoiceListCreateView,
    PrintableInvoicePDFView,
    PrintableInvoicePrintView,
    PrintableInvoiceRetrieveView,
)

urlpatterns = [
    path("parties/", PartyListCreateView.as_view(), name="party-list-create"),
    path("parties/<int:pk>/", PartyRetrieveUpdateView.as_view(), name="party-detail"),
    path("invoice-sequence-setting/", InvoiceSequenceSettingView.as_view(), name="invoice-sequence-setting"),
    path("invoices/", PrintableInvoiceListCreateView.as_view(), name="printable-invoice-list-create"),
    path("invoices/<int:pk>/", PrintableInvoiceRetrieveView.as_view(), name="printable-invoice-detail"),
    path("invoices/<int:pk>/print/", PrintableInvoicePrintView.as_view(), name="printable-invoice-print"),
    path("invoices/<int:pk>/pdf/", PrintableInvoicePDFView.as_view(), name="printable-invoice-pdf"),
]