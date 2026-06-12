# core/migrations/0002_auditlog_actor_username_ip_address.py

from django.db import migrations, models


def backfill_actor_username(apps, schema_editor):
    """
    Populate actor_username from the related user for all existing rows.
    Rows where actor is NULL are left with an empty string (already the default).
    """
    AuditLog = apps.get_model("core", "AuditLog")
    for log in AuditLog.objects.select_related("actor").filter(actor__isnull=False).iterator():
        log.actor_username = log.actor.username or ""
        log.save(update_fields=["actor_username"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="auditlog",
            name="actor_username",
            field=models.CharField(blank=True, max_length=150, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="auditlog",
            name="ip_address",
            field=models.GenericIPAddressField(blank=True, null=True),
        ),
        # Extend action field from max_length=100 to 255 to accommodate
        # longer dot-separated action strings (e.g. "stock.transfer.created")
        migrations.AlterField(
            model_name="auditlog",
            name="action",
            field=models.CharField(max_length=255),
        ),
        migrations.RunPython(backfill_actor_username, migrations.RunPython.noop),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["actor", "created_at"], name="core_auditl_actor_c3d1a2_idx"),
        ),
    ]