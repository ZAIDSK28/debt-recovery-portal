from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("bills", "0004_bill_invoice_and_cancelled"),
        ("reports", "0004_invoice_status_lifecycle"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="printableinvoice",
            name="linked_bill",
        ),
    ]