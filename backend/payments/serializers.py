# payments/serializers.py

from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from bills.models import Bill
from payments.models import Payment
from payments.services import reconcile_bill_from_payments


class PaymentSerializer(serializers.ModelSerializer):
    bill_invoice_number = serializers.CharField(source="bill.invoice_number", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "bill",
            "bill_invoice_number",
            "dra_username",
            "payment_method",
            "amount",
            "transaction_number",
            "firm",
            "created_at",
            "cheque_number",
            "cheque_date",
            "cheque_type",
            "cheque_status",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.payment_method not in [Payment.PaymentMethod.CHEQUE, Payment.PaymentMethod.ELECTRONIC]:
            data.pop("cheque_number", None)
            data.pop("cheque_date", None)
            data.pop("cheque_type", None)
            data.pop("cheque_status", None)
        return data


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "amount",
            "payment_method",
            "transaction_number",
            "cheque_number",
            "cheque_date",
            "cheque_type",
            "cheque_status",
            "firm",
        ]

    def validate_amount(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate(self, attrs):
        bill: Bill = self.context["bill"]
        method = attrs["payment_method"]
        amount = attrs["amount"]

        if amount > bill.remaining_amount:
            raise serializers.ValidationError({"amount": "Amount cannot exceed remaining amount."})

        if method == Payment.PaymentMethod.UPI:
            if not attrs.get("transaction_number"):
                raise serializers.ValidationError({"transaction_number": "Transaction number is required."})

        if method in [Payment.PaymentMethod.CHEQUE, Payment.PaymentMethod.ELECTRONIC]:
            required_fields = {
                "cheque_number": attrs.get("cheque_number"),
                "cheque_date": attrs.get("cheque_date"),
                "cheque_type": attrs.get("cheque_type"),
                "firm": attrs.get("firm"),
            }
            for field, value in required_fields.items():
                if not value:
                    raise serializers.ValidationError({field: f"{field.replace('_', ' ').title()} is required."})

            if method == Payment.PaymentMethod.ELECTRONIC and not attrs.get("transaction_number"):
                raise serializers.ValidationError({"transaction_number": "Transaction number is required."})

            if not attrs.get("cheque_status"):
                attrs["cheque_status"] = Payment.ChequeStatus.PENDING
        else:
            attrs["cheque_number"] = ""
            attrs["cheque_date"] = None
            attrs["cheque_type"] = ""
            attrs["cheque_status"] = ""
            if method == Payment.PaymentMethod.CASH:
                attrs["transaction_number"] = attrs.get("transaction_number", "") or ""

        return attrs

    def create(self, validated_data):
        requested_bill: Bill = self.context["bill"]
        user = self.context["request"].user

        with transaction.atomic():
            bill = Bill.objects.select_for_update().get(pk=requested_bill.pk)

            if bill.assigned_to_id != user.id or bill.status != Bill.Status.OPEN:
                raise serializers.ValidationError({"detail": "Bill not found."})

            if validated_data["amount"] > bill.remaining_amount:
                raise serializers.ValidationError({"amount": "Amount cannot exceed remaining amount."})

            payment = Payment.objects.create(
                bill=bill,
                dra_username=user.username,
                **validated_data,
            )
            reconcile_bill_from_payments(bill)
            return payment


class PaymentStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["cheque_status"]

    def validate_cheque_status(self, value):
        if value not in [
            Payment.ChequeStatus.PENDING,
            Payment.ChequeStatus.CLEARED,
            Payment.ChequeStatus.BOUNCED,
        ]:
            raise serializers.ValidationError("Invalid cheque status.")
        return value

    def update(self, instance, validated_data):
        with transaction.atomic():
            payment = (
                Payment.objects.select_for_update()
                .select_related("bill")
                .get(pk=instance.pk)
            )
            payment = super().update(payment, validated_data)
            bill = Bill.objects.select_for_update().get(pk=payment.bill_id)
            reconcile_bill_from_payments(bill)
            return payment


class DailySummarySerializer(serializers.Serializer):
    date = serializers.DateField()
    cash_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    upi_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    cheque_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    electronic_total = serializers.DecimalField(max_digits=12, decimal_places=2)


class TodayTotalsSerializer(serializers.Serializer):
    cash_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    upi_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    cheque_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    electronic_total = serializers.DecimalField(max_digits=12, decimal_places=2)