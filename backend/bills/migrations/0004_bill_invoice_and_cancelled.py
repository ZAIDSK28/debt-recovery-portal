from django.db import migrations, models
import django.db.models.deletion


def link_existing_invoices(apps, schema_editor):
    Bill = apps.get_model("bills", "Bill")
    PrintableInvoice = apps.get_model("reports", "PrintableInvoice")

    for invoice in PrintableInvoice.objects.exclude(linked_bill__isnull=True).iterator():
        bill = invoice.linked_bill
        if bill:
            bill.invoice_id = invoice.id
            bill.save(update_fields=["invoice"])


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0003_product_backed_invoice_items"),
        ("bills", "0003_billimportjob"),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="invoice",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="recovery_bill",
                to="reports.printableinvoice",
            ),
        ),
        migrations.AddField(
            model_name="bill",
            name="cancelled_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="bill",
            name="status",
            field=models.CharField(
                choices=[("open", "Open"), ("cleared", "Cleared"), ("cancelled", "Cancelled")],
                default="open",
                max_length=20,
            ),
        ),
        migrations.RunPython(link_existing_invoices, migrations.RunPython.noop),
    ]