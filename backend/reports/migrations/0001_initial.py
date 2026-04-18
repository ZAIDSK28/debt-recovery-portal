# reports/migrations/0001_initial.py

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PrintableInvoice",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("invoice_number", models.CharField(max_length=100, unique=True)),
                ("invoice_date", models.DateField()),
                ("customer_name", models.CharField(max_length=255)),
                ("customer_address", models.TextField(blank=True)),
                ("customer_phone", models.CharField(blank=True, max_length=50)),
                ("gst_number", models.CharField(blank=True, max_length=100)),
                ("route_name", models.CharField(blank=True, max_length=255)),
                ("outlet_name", models.CharField(blank=True, max_length=255)),
                ("brand", models.CharField(blank=True, max_length=255)),
                ("subtotal", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("tax_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("discount_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("total_amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("notes", models.TextField(blank=True)),
                ("terms", models.TextField(blank=True)),
                ("creation_mode", models.CharField(choices=[("bill_only", "Bill Only"), ("printable_only", "Printable Only"), ("printable_and_bill", "Printable And Bill")], max_length=30)),
                ("linked_bill_id", models.BigIntegerField(blank=True, null=True)),
                ("payload", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="printable_invoices", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="PrintableInvoiceItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("description", models.CharField(max_length=255)),
                ("quantity", models.DecimalField(decimal_places=2, default=1, max_digits=12)),
                ("rate", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("invoice", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="reports.printableinvoice")),
            ],
            options={
                "ordering": ["id"],
            },
        ),
    ]