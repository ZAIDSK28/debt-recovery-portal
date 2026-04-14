from __future__ import annotations

from django.db import models


class Payment(models.Model):
    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Cash"
        UPI = "upi", "UPI"
        CHEQUE = "cheque", "Cheque"
        ELECTRONIC = "electronic", "Electronic"

    class ChequeType(models.TextChoices):
        RTGS = "rtgs", "RTGS"
        NEFT = "neft", "NEFT"
        IMPS = "imps", "IMPS"

    class ChequeStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        CLEARED = "cleared", "Cleared"
        BOUNCED = "bounced", "Bounced"

    class Firm(models.TextChoices):
        NA = "NA", "NA"
        MZ = "MZ", "MZ"

    bill = models.ForeignKey("bills.Bill", on_delete=models.CASCADE, related_name="payments")
    dra_username = models.CharField(max_length=150)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_number = models.CharField(max_length=255, blank=True)
    cheque_number = models.CharField(max_length=255, blank=True)
    cheque_date = models.DateField(null=True, blank=True)
    cheque_type = models.CharField(max_length=20, choices=ChequeType.choices, blank=True)
    cheque_status = models.CharField(
        max_length=20,
        choices=ChequeStatus.choices,
        default=ChequeStatus.PENDING,
    )
    firm = models.CharField(max_length=10, choices=Firm.choices, default=Firm.NA)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]