# core/views.py
from rest_framework import generics
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.models import AuditLog
from core.permissions import IsAdmin
from core.serializers import AuditLogSerializer
from django_filters import rest_framework as filters


class AuditLogFilter(filters.FilterSet):
    start_date = filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    end_date = filters.DateFilter(field_name="created_at", lookup_expr="date__lte")
    action = filters.CharFilter(lookup_expr="icontains")
    entity_type = filters.CharFilter(lookup_expr="icontains")
    actor_username = filters.CharFilter(lookup_expr="icontains")

    class Meta:
        model = AuditLog
        fields = ["action", "entity_type", "actor_username", "start_date", "end_date"]


class AuditLogListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.select_related("actor").all().order_by("-created_at")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = AuditLogFilter
    search_fields = ["action", "entity_type", "actor_username", "metadata"]
    ordering_fields = ["created_at", "action", "entity_type"]
    ordering = ["-created_at"]