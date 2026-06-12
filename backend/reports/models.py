# reports/models.py

from django.conf import settings
from django.db import models
import random
import string


class Party(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    gst_number = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name", "id"]

    def __str__(self):
        return self.name


class InvoiceSequenceSetting(models.Model):
    name = models.CharField(max_length=100, default="default", unique=True)
    prefix = models.CharField(max_length=50, default="INV")
    date_format = models.CharField(max_length=50, default="%Y%m")
    separator = models.CharField(max_length=10, default="-")
    next_number = models.PositiveIntegerField(default=1)
    padding = models.PositiveIntegerField(default=4)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    @classmethod
    def get_active(cls):
        obj, _ = cls.objects.get_or_create(
            name="default",
            defaults={
                "prefix": "INV",
                "date_format": "%Y%m",
                "separator": "-",
                "next_number": 1,
                "padding": 4,
                "is_active": True,
            },
        )
        return obj

    def _random_suffix(self, length: int = 6) -> str:
        alphabet = string.ascii_uppercase + string.digits
        return "".join(random.choices(alphabet, k=length))

    def generate_invoice_number(self):
        random_part = self._random_suffix(6)
        parts = [part for part in [self.prefix, random_part] if part]
        return self.separator.join(parts)


class PrintableInvoice(models.Model):
    class CreationMode(models.TextChoices):
        BILL_ONLY = "bill_only", "Bill Only"
        PRINTABLE_ONLY = "printable_only", "Printable Only"
        PRINTABLE_AND_BILL = "printable_and_bill", "Printable And Bill"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        FINALIZED = "finalized", "Finalized"
        CANCELLED = "cancelled", "Cancelled"

    invoice_number = models.CharField(max_length=100, unique=True)
    invoice_date = models.DateField()

    party = models.ForeignKey(
        "reports.Party",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="invoices",
    )

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
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.FINALIZED)

    payload = models.JSONField(default=dict, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="printable_invoices",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.invoice_number


class PrintableInvoiceItem(models.Model):
    invoice = models.ForeignKey(PrintableInvoice, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("products.Product", null=True, blank=True, on_delete=models.SET_NULL, related_name="invoice_items")
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ["id"]