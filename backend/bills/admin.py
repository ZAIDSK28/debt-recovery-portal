from django.contrib import admin

from bills.models import Bill, Outlet, Route


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Outlet)
class OutletAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "route")
    list_filter = ("route",)
    search_fields = ("name", "route__name")


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "invoice_number",
        "invoice_date",
        "outlet",
        "brand",
        "actual_amount",
        "remaining_amount",
        "overdue_days",
        "status",
        "assigned_to",
        "created_at",
    )
    list_filter = ("status", "brand", "outlet__route")
    search_fields = ("invoice_number", "outlet__name", "outlet__route__name", "assigned_to__username")