# payments/services.py

from __future__ import annotations

from decimal import Decimal

from bills.models import Bill
from payments.models import Payment
from django.db.models import Q, Sum, Value
from django.db.models.functions import Coalesce



IMMEDIATE_METHODS = {Payment.PaymentMethod.CASH, Payment.PaymentMethod.UPI}
CONDITIONAL_METHODS = {Payment.PaymentMethod.CHEQUE, Payment.PaymentMethod.ELECTRONIC}


def models_sum(field_name: str):
    return Sum(field_name)


def get_effective_paid_amount_for_bill(bill: Bill) -> Decimal:
    totals = bill.payments.aggregate(
        immediate=Coalesce(
            Sum("amount", filter=Q(payment_method__in=IMMEDIATE_METHODS)),
            Value(Decimal("0.00")),
        ),
        conditional=Coalesce(
            Sum(
                "amount",
                filter=Q(
                    payment_method__in=CONDITIONAL_METHODS,
                    cheque_status=Payment.ChequeStatus.CLEARED,
                ),
            ),
            Value(Decimal("0.00")),
        ),
    )
    return totals["immediate"] + totals["conditional"]


def reconcile_bill_from_payments(bill: Bill) -> Bill:
    effective_paid = get_effective_paid_amount_for_bill(bill)
    bill.remaining_amount = bill.actual_amount - effective_paid
    if bill.remaining_amount < Decimal("0.00"):
        bill.remaining_amount = Decimal("0.00")
    bill.save(update_fields=["remaining_amount", "overdue_days", "status", "cleared_at"])
    return bill