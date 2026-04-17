# bills/urls.py

from django.urls import path

from bills.views import (
    AssignBillsView,
    BillImportStatusView,
    BillListCreateView,
    BillRetrieveUpdateDeleteView,
    ExportBillsView,
    ImportBillsView,
    MyAssignmentsFlatView,
    OutletListView,
    RouteListView,
)

urlpatterns = [
    path("", BillListCreateView.as_view(), name="bills-list-create"),
    path("<int:pk>/", BillRetrieveUpdateDeleteView.as_view(), name="bills-detail"),
    path("assign/", AssignBillsView.as_view(), name="bills-assign"),
    path("export/", ExportBillsView.as_view(), name="bills-export"),
    path("import/", ImportBillsView.as_view(), name="bills-import"),
    path("import/<int:pk>/status/", BillImportStatusView.as_view(), name="bills-import-status"),
    path("routes/", RouteListView.as_view(), name="routes-list"),
    path("outlets/", OutletListView.as_view(), name="outlets-list"),
    path("my-assignments-flat/", MyAssignmentsFlatView.as_view(), name="my-assignments-flat"),
]