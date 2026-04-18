# reports/models.py

from django.conf import settings
from django.db import models


class PrintableInvoice(models.Model):
    class InvoiceKind(models.TextChoices):
        STANDARD = "standard", "Standard"
        PRINTABLE = "printable", "Printable"

    class CreationMode(models.TextChoices):
        BILL_ONLY = "bill_only", "Bill Only"
        PRINTABLE_ONLY = "printable_only", "Printable Only"
        PRINTABLE_AND_BILL = "printable_and_bill", "Printable And Bill"

    invoice_number = models.CharField(max_length=100, unique=True)
    invoice_date = models.DateField()

    customer_name = models.CharField(max_length=255)
    customer_address = models.TextField(blank=True)
    customer_phone = models.CharField(max_length=50, blank=True)
    gst_number = models.CharField(max_length=100, blank=True)

    route_name = models.CharField(max_length=255, blank=True)
    outlet_name = models.CharField(max_length=255, blank=True)
    brand = models.CharField(max_length=255, blank=True)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)

    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)

    creation_mode = models.CharField(max_length=30, choices=CreationMode.choices)
    linked_bill_id = models.BigIntegerField(null=True, blank=True)

    payload = models.JSONField(default=dict, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="printable_invoices",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.invoice_number


class PrintableInvoiceItem(models.Model):
    invoice = models.ForeignKey(PrintableInvoice, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ["id"]