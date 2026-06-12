from django.contrib import admin

from reports.models import InvoiceSequenceSetting, Party, PrintableInvoice, PrintableInvoiceItem


class PrintableInvoiceItemInline(admin.TabularInline):
    model = PrintableInvoiceItem
    extra = 0


@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "phone", "email", "gst_number", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "phone", "email", "gst_number")


@admin.register(InvoiceSequenceSetting)
class InvoiceSequenceSettingAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "prefix", "date_format", "separator", "next_number", "padding", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("name", "prefix")


@admin.register(PrintableInvoice)
class PrintableInvoiceAdmin(admin.ModelAdmin):
    list_display = ("id", "invoice_number", "invoice_date", "party", "customer_name", "total_amount", "status", "created_at")
    list_filter = ("status", "creation_mode", "invoice_date")
    search_fields = ("invoice_number", "customer_name", "brand")
    inlines = [PrintableInvoiceItemInline]