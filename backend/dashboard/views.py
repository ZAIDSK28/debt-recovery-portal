from datetime import timedelta
from django.utils import timezone

from rest_framework import status, views, serializers
from rest_framework.response import Response

from dashboard.models import DailyCollectionMetric
from core.permissions import IsAdmin
from core.utils import create_audit_log
from dashboard.serializers import DashboardSummarySerializer, DailyCollectionMetricSerializer
from dashboard.services import get_summary, rebuild_daily_metrics


def parse_days(value, field_name="days"):
    if value in [None, ""]:
        return 30
    try:
        days = int(value)
    except (TypeError, ValueError):
        raise serializers.ValidationError({field_name: "A valid integer is required."})
    if days <= 0:
        raise serializers.ValidationError({field_name: "Value must be greater than zero."})
    return days


class DashboardSummaryView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        days = parse_days(request.query_params.get("days", 30))
        serializer = DashboardSummarySerializer(instance=get_summary(days=days))
        return Response(serializer.data)


class DailyCollectionsView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        days = parse_days(request.query_params.get("days", 30))
        end_date = timezone.localdate()
        start_date = end_date - timedelta(days=days - 1)
        metrics = DailyCollectionMetric.objects.filter(
            date__gte=start_date, date__lte=end_date
        ).order_by("date")
        serializer = DailyCollectionMetricSerializer(metrics, many=True)
        return Response(serializer.data)


class RebuildDailyCollectionsView(views.APIView):
    permission_classes = [IsAdmin]

    def post(self, request, *args, **kwargs):
        days = parse_days(request.data.get("days", 30))
        metrics = rebuild_daily_metrics(days=days)

        create_audit_log(
            actor=request.user,
            action="dashboard.daily_metrics.rebuilt",
            entity_type="dashboard",
            entity_id="daily_collection_metrics",
            metadata={"days": days},
            request=self.request,
        )

        serializer = DailyCollectionMetricSerializer(metrics, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)