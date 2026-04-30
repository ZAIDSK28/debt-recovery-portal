from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0003_product_backed_invoice_items"),
    ]

    operations = [
        migrations.AddField(
            model_name="printableinvoice",
            name="status",
            field=models.CharField(
                choices=[("draft", "Draft"), ("finalized", "Finalized"), ("cancelled", "Cancelled")],
                default="draft",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="printableinvoice",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="printableinvoice",
            name="finalized_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="printableinvoice",
            name="cancelled_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]