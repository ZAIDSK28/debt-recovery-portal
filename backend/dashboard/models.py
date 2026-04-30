from django.db import models


class DailyCollectionMetric(models.Model):
    date = models.DateField(unique=True)
    cash_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    upi_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cheque_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    electronic_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_collection = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_count = models.PositiveIntegerField(default=0)
    bill_count_cleared = models.PositiveIntegerField(default=0)
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self) -> str:
        return str(self.date)