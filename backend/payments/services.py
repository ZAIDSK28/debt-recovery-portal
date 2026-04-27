# payments/services.py

from __future__ import annotations

from decimal import Decimal

from django.db.models import Sum

from bills.models import Bill
from payments.models import Payment


IMMEDIATE_METHODS = {Payment.PaymentMethod.CASH, Payment.PaymentMethod.UPI}
CONDITIONAL_METHODS = {Payment.PaymentMethod.CHEQUE, Payment.PaymentMethod.ELECTRONIC}


def models_sum(field_name: str):
    return Sum(field_name)


def get_effective_paid_amount_for_bill(bill: Bill) -> Decimal:
    immediate_total = (
        bill.payments.filter(payment_method__in=IMMEDIATE_METHODS).aggregate(total=models_sum("amount"))["total"]
        or Decimal("0.00")
    )
    conditional_total = (
        bill.payments.filter(
            payment_method__in=CONDITIONAL_METHODS,
            cheque_status=Payment.ChequeStatus.CLEARED,
        ).aggregate(total=models_sum("amount"))["total"]
        or Decimal("0.00")
    )
    return immediate_total + conditional_total


def reconcile_bill_from_payments(bill: Bill) -> Bill:
    effective_paid = get_effective_paid_amount_for_bill(bill)
    bill.remaining_amount = bill.actual_amount - effective_paid
    if bill.remaining_amount < Decimal("0.00"):
        bill.remaining_amount = Decimal("0.00")
    bill.save(update_fields=["remaining_amount", "overdue_days", "status", "cleared_at"])
    return bill