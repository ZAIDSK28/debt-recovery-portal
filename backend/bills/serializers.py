from __future__ import annotations

from decimal import Decimal

from rest_framework import serializers

from bills.models import Bill, Outlet, Route
from users.models import User


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = ["id", "name"]


class OutletSerializer(serializers.ModelSerializer):
    route_id = serializers.IntegerField(source="route.id", read_only=True)
    route_name = serializers.CharField(source="route.name", read_only=True)

    class Meta:
        model = Outlet
        fields = ["id", "name", "route_id", "route_name"]


class BillSerializer(serializers.ModelSerializer):
    route_id = serializers.IntegerField(source="outlet.route.id", read_only=True)
    outlet_name = serializers.CharField(source="outlet.name", read_only=True)
    route_name = serializers.CharField(source="outlet.route.name", read_only=True)
    assigned_to_id = serializers.IntegerField(source="assigned_to.id", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True)

    class Meta:
        model = Bill
        fields = [
            "id",
            "invoice_number",
            "invoice_date",
            "outlet",
            "route_id",
            "outlet_name",
            "route_name",
            "brand",
            "actual_amount",
            "remaining_amount",
            "overdue_days",
            "status",
            "assigned_to_id",
            "assigned_to_name",
            "created_at",
            "cleared_at",
        ]

    def validate(self, attrs):
        actual_amount = attrs.get("actual_amount", getattr(self.instance, "actual_amount", None))
        remaining_amount = attrs.get("remaining_amount", getattr(self.instance, "remaining_amount", None))

        if actual_amount is not None and actual_amount <= Decimal("0.00"):
            raise serializers.ValidationError({"actual_amount": "Amount must be greater than zero."})

        if remaining_amount is not None and remaining_amount < Decimal("0.00"):
            raise serializers.ValidationError({"remaining_amount": "Remaining amount cannot be negative."})

        if actual_amount is not None and remaining_amount is not None and remaining_amount > actual_amount:
            raise serializers.ValidationError({"remaining_amount": "Remaining amount cannot exceed actual amount."})

        return attrs


class BillCreateUpdateSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.DRA),
        required=False,
        allow_null=True,
    )
    remaining_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
    )

    class Meta:
        model = Bill
        fields = [
            "id",
            "invoice_number",
            "invoice_date",
            "outlet",
            "brand",
            "actual_amount",
            "remaining_amount",
            "assigned_to",
        ]

    def validate_actual_amount(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate(self, attrs):
        actual_amount = attrs.get("actual_amount", getattr(self.instance, "actual_amount", None))
        remaining_amount = attrs.get("remaining_amount", getattr(self.instance, "remaining_amount", None))

        if self.instance is None and remaining_amount is None and actual_amount is not None:
            attrs["remaining_amount"] = actual_amount
            remaining_amount = actual_amount

        if actual_amount is not None and remaining_amount is not None:
            if remaining_amount < Decimal("0.00"):
                raise serializers.ValidationError({"remaining_amount": "Remaining amount cannot be negative."})
            if remaining_amount > actual_amount:
                raise serializers.ValidationError({"remaining_amount": "Remaining amount cannot exceed actual amount."})

        return attrs

class AssignBillsSerializer(serializers.Serializer):
    bill_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.DRA),
        allow_null=True,
        required=False,
    )