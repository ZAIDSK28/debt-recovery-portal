# reports/urls.py

from django.urls import path

from reports.views import (
    PrintableInvoiceListCreateView,
    PrintableInvoicePDFView,
    PrintableInvoicePrintView,
    PrintableInvoiceRetrieveView,
)

urlpatterns = [
    path("invoices/", PrintableInvoiceListCreateView.as_view(), name="printable-invoice-list-create"),
    path("invoices/<int:pk>/", PrintableInvoiceRetrieveView.as_view(), name="printable-invoice-detail"),
    path("invoices/<int:pk>/print/", PrintableInvoicePrintView.as_view(), name="printable-invoice-print"),
    path("invoices/<int:pk>/pdf/", PrintableInvoicePDFView.as_view(), name="printable-invoice-pdf"),
]