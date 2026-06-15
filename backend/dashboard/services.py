from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.db.models import Q, Count, DecimalField, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

from bills.models import Bill
from dashboard.models import DailyCollectionMetric
from payments.models import Payment


amount_field = DecimalField(max_digits=12, decimal_places=2)


def _sum_amount(queryset):
    return queryset.aggregate(
        total=Coalesce(Sum("amount"), Value(0), output_field=amount_field)
    )["total"]


def rebuild_daily_metric_for_date(target_date):
    payments = Payment.objects.filter(created_at__date=target_date)

    totals = payments.aggregate(
        cash_total=Coalesce(
            Sum("amount", filter=Q(payment_method=Payment.PaymentMethod.CASH)),
            Value(Decimal("0.00"), output_field=amount_field),
        ),
        upi_total=Coalesce(
            Sum("amount", filter=Q(payment_method=Payment.PaymentMethod.UPI)),
            Value(Decimal("0.00"), output_field=amount_field),
        ),
        cheque_total=Coalesce(
            Sum(
                "amount",
                filter=Q(
                    payment_method=Payment.PaymentMethod.CHEQUE,
                    cheque_status=Payment.ChequeStatus.CLEARED,
                ),
            ),
            Value(Decimal("0.00"), output_field=amount_field),
        ),
        electronic_total=Coalesce(
            Sum(
                "amount",
                filter=Q(
                    payment_method=Payment.PaymentMethod.ELECTRONIC,
                    cheque_status=Payment.ChequeStatus.CLEARED,
                ),
            ),
            Value(Decimal("0.00"), output_field=amount_field),
        ),
        payment_count=Count("id"),
    )

    cash_total = totals["cash_total"]
    upi_total = totals["upi_total"]
    cheque_total = totals["cheque_total"]
    electronic_total = totals["electronic_total"]
    payment_count = totals["payment_count"]
    total_collection = cash_total + upi_total + cheque_total + electronic_total
    bill_count_cleared = Bill.objects.filter(cleared_at__date=target_date).count()

    metric, _ = DailyCollectionMetric.objects.update_or_create(
        date=target_date,
        defaults={
            "cash_total": cash_total,
            "upi_total": upi_total,
            "cheque_total": cheque_total,
            "electronic_total": electronic_total,
            "total_collection": total_collection,
            "payment_count": payment_count,
            "bill_count_cleared": bill_count_cleared,
        },
    )
    return metric


def rebuild_daily_metrics(days: int = 30):
    end_date = timezone.localdate()
    start_date = end_date - timedelta(days=days - 1)
    current = start_date
    metrics = []

    while current <= end_date:
        metrics.append(rebuild_daily_metric_for_date(current))
        current += timedelta(days=1)

    return metrics


def get_summary(days: int = 30):
    end_date = timezone.localdate()
    start_date = end_date - timedelta(days=days - 1)
    qs = DailyCollectionMetric.objects.filter(date__gte=start_date, date__lte=end_date)

    aggregated = qs.aggregate(
        total_collection=Coalesce(Sum("total_collection"), Value(0), output_field=amount_field),
        total_cash=Coalesce(Sum("cash_total"), Value(0), output_field=amount_field),
        total_upi=Coalesce(Sum("upi_total"), Value(0), output_field=amount_field),
        total_cheque=Coalesce(Sum("cheque_total"), Value(0), output_field=amount_field),
        total_electronic=Coalesce(Sum("electronic_total"), Value(0), output_field=amount_field),
        total_payments=Coalesce(Sum("payment_count"), Value(0)),
        total_cleared_bills=Coalesce(Sum("bill_count_cleared"), Value(0)),
    )
    return aggregated