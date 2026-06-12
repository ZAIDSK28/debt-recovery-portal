# products/migrations/0003_stocktransfer.py

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0002_productcategory_warehouse_stockmovement_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddIndex(
            model_name="stockmovement",
            index=models.Index(fields=["product", "warehouse"], name="products_st_product_4a3e21_idx"),
        ),
        migrations.AddIndex(
            model_name="stockmovement",
            index=models.Index(fields=["created_at"], name="products_st_created_8f2b14_idx"),
        ),
        migrations.CreateModel(
            name="StockTransfer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.DecimalField(decimal_places=2, max_digits=12)),
                ("note", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="stock_transfers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "destination_warehouse",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="incoming_transfers",
                        to="products.warehouse",
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="transfers",
                        to="products.product",
                    ),
                ),
                (
                    "source_warehouse",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="outgoing_transfers",
                        to="products.warehouse",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="stocktransfer",
            index=models.Index(
                fields=["source_warehouse", "created_at"],
                name="products_st_source__b3c1d2_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="stocktransfer",
            index=models.Index(
                fields=["destination_warehouse", "created_at"],
                name="products_st_dest__a7f3e1_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="stocktransfer",
            index=models.Index(
                fields=["product"],
                name="products_st_product_c8d2b1_idx",
            ),
        ),
    ]