from django_filters import rest_framework as filters
from bills.models import Bill


class BillFilterSet(filters.FilterSet):
    assigned_to_id = filters.NumberFilter(field_name="assigned_to_id")
    status = filters.CharFilter(field_name="status")
    route_id = filters.NumberFilter(field_name="outlet__route_id")
    
    # Add date range filters
    start_date = filters.DateFilter(field_name="invoice_date", lookup_expr="gte")
    end_date = filters.DateFilter(field_name="invoice_date", lookup_expr="lte")

    class Meta:
        model = Bill
        fields = ["assigned_to_id", "status", "route_id", "start_date", "end_date"]