from django.urls import path

from payments.views import (
    AllPaymentsView,
    DailySummaryView,
    ExportPaymentsView,
    PaymentUpdateView,
    RecordPaymentView,
    TodayTotalsView,
)

urlpatterns = [
    path("<int:bill_id>/payments/", RecordPaymentView.as_view(), name="record-payment"),
    path("all/", AllPaymentsView.as_view(), name="payments-all"),
    path("<int:pk>/", PaymentUpdateView.as_view(), name="payments-update"),
    path("today-totals/", TodayTotalsView.as_view(), name="payments-today-totals"),
    path("daily-summary/", DailySummaryView.as_view(), name="payments-daily-summary"),
    path("export/", ExportPaymentsView.as_view(), name="payments-export"),
]