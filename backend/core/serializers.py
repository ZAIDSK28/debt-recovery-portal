# core/serializers.py
from rest_framework import serializers
from core.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor_username", read_only=True)
    actor_id = serializers.IntegerField(source="actor.id", read_only=True, allow_null=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor_id",
            "actor_name",
            "action",
            "entity_type",
            "entity_id",
            "metadata",
            "ip_address",
            "created_at",
        ]