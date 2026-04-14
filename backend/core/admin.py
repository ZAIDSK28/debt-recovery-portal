from django.contrib import admin

from core.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "actor", "action", "entity_type", "entity_id", "created_at")
    list_filter = ("action", "entity_type", "created_at")
    search_fields = ("entity_type", "entity_id", "actor__username")