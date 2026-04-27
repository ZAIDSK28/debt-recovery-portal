# reports/migrations/0003_product_backed_invoice_items.py

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0001_initial"),
        ("reports", "0002_printableinvoice_linked_bill_relation"),
    ]

    operations = [
        migrations.AddField(
            model_name="printableinvoiceitem",
            name="product",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="invoice_items", to="products.product"),
        ),
        migrations.AddField(
            model_name="printableinvoiceitem",
            name="tax_rate",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name="printableinvoiceitem",
            name="tax_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="printableinvoiceitem",
            name="line_total",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]