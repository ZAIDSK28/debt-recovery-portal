from django.db import migrations, models
import django.db.models.deletion


def backfill_product_category_refs(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    ProductCategory = apps.get_model("products", "ProductCategory")

    category_values = (
        Product.objects.exclude(category__isnull=True)
        .exclude(category__exact="")
        .values_list("category", flat=True)
        .distinct()
    )

    category_map = {}
    for name in category_values:
        obj, _ = ProductCategory.objects.get_or_create(
            name=name,
            defaults={"description": "", "is_active": True},
        )
        category_map[name] = obj.id

    for product in Product.objects.all().iterator():
        if product.category and product.category in category_map:
            product.category_ref_id = category_map[product.category]
            product.save(update_fields=["category_ref"])


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255, unique=True)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Warehouse",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255, unique=True)),
                ("location", models.CharField(blank=True, max_length=255)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddField(
            model_name="product",
            name="category_ref",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="products",
                to="products.productcategory",
            ),
        ),
        migrations.RunPython(backfill_product_category_refs, migrations.RunPython.noop),
        migrations.CreateModel(
            name="StockItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("reorder_level", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="stock_items", to="products.product")),
                ("warehouse", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="stock_items", to="products.warehouse")),
            ],
            options={
                "ordering": ["warehouse__name", "product__name"],
                "unique_together": {("product", "warehouse")},
            },
        ),
        migrations.CreateModel(
            name="StockMovement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("movement_type", models.CharField(choices=[("in", "In"), ("out", "Out"), ("adjustment", "Adjustment")], max_length=20)),
                ("quantity", models.DecimalField(decimal_places=2, max_digits=12)),
                ("note", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="stock_movements", to="products.product")),
                ("warehouse", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="stock_movements", to="products.warehouse")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]