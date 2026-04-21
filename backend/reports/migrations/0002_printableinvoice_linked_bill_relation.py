# reports/migrations/0002_printableinvoice_linked_bill_relation.py

from django.db import migrations, models
import django.db.models.deletion


def forward_copy_linked_bill(apps, schema_editor):
    PrintableInvoice = apps.get_model("reports", "PrintableInvoice")
    Bill = apps.get_model("bills", "Bill")

    seen_bill_ids = set()

    for invoice in PrintableInvoice.objects.exclude(linked_bill_id__isnull=True).order_by("id").iterator():
        bill_id = invoice.linked_bill_id
        if not bill_id or bill_id in seen_bill_ids:
            continue

        bill = Bill.objects.filter(id=bill_id).first()
        if bill:
            invoice.linked_bill_ref = bill
            invoice.save(update_fields=["linked_bill_ref"])
            seen_bill_ids.add(bill_id)


def backward_copy_linked_bill(apps, schema_editor):
    PrintableInvoice = apps.get_model("reports", "PrintableInvoice")

    for invoice in PrintableInvoice.objects.all().iterator():
        invoice.linked_bill_id = invoice.linked_bill_ref_id
        invoice.save(update_fields=["linked_bill_id"])


class Migration(migrations.Migration):

    dependencies = [
        ("bills", "0002_initial"),
        ("reports", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="printableinvoice",
            name="linked_bill_ref",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to="bills.bill",
            ),
        ),
        migrations.RunPython(forward_copy_linked_bill, backward_copy_linked_bill),
        migrations.RemoveField(
            model_name="printableinvoice",
            name="linked_bill_id",
        ),
        migrations.RenameField(
            model_name="printableinvoice",
            old_name="linked_bill_ref",
            new_name="linked_bill",
        ),
        migrations.AlterField(
            model_name="printableinvoice",
            name="linked_bill",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="printable_invoice",
                to="bills.bill",
            ),
        ),
    ]