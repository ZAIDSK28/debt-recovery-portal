from django.contrib import admin

from payments.models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "bill",
        "dra_username",
        "payment_method",
        "amount",
        "transaction_number",
        "cheque_number",
        "cheque_status",
        "firm",
        "created_at",
    )
    list_filter = ("payment_method", "cheque_status", "firm")
    search_fields = ("bill__invoice_number", "dra_username", "transaction_number", "cheque_number")