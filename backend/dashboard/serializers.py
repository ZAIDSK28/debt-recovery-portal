from rest_framework import serializers

from dashboard.models import DailyCollectionMetric


class DashboardSummarySerializer(serializers.Serializer):
    total_collection = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_cash = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_upi = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_cheque = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_electronic = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_payments = serializers.IntegerField()
    total_cleared_bills = serializers.IntegerField()


class DailyCollectionMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyCollectionMetric
        fields = [
            "date",
            "cash_total",
            "upi_total",
            "cheque_total",
            "electronic_total",
            "total_collection",
            "payment_count",
            "bill_count_cleared",
            "generated_at",
        ]