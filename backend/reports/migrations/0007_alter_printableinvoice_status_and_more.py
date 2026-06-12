from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0006_remove_unused_invoice_lifecycle_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="Party",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("address", models.TextField(blank=True)),
                ("phone", models.CharField(blank=True, max_length=50)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("gst_number", models.CharField(blank=True, max_length=100)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["name", "id"]},
        ),
        migrations.CreateModel(
            name="InvoiceSequenceSetting",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(default="default", max_length=100, unique=True)),
                ("prefix", models.CharField(default="INV", max_length=50)),
                ("date_format", models.CharField(default="%Y%m", max_length=50)),
                ("separator", models.CharField(default="-", max_length=10)),
                ("next_number", models.PositiveIntegerField(default=1)),
                ("padding", models.PositiveIntegerField(default=4)),
                ("is_active", models.BooleanField(default=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddField(
            model_name="printableinvoice",
            name="party",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="invoices",
                to="reports.party",
            ),
        ),
    ]