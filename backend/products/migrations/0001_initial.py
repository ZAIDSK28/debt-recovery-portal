# products/migrations/0001_initial.py

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("product_code", models.CharField(max_length=100, unique=True)),
                ("category", models.CharField(max_length=255)),
                ("name", models.CharField(max_length=255)),
                ("price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("default_quantity", models.DecimalField(decimal_places=2, default=1, max_digits=12)),
                ("tax_rate", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["name", "product_code"]},
        ),
    ]