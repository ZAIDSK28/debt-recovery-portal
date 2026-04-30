from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0005_remove_old_linked_bill"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="printableinvoice",
            name="finalized_at",
        ),
        migrations.RemoveField(
            model_name="printableinvoice",
            name="cancelled_at",
        ),
    ]