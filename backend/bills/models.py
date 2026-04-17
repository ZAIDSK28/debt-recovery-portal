# bills/models.py

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models

from core.utils import calculate_overdue_days


class Route(models.Model):
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Outlet(models.Model):
    name = models.CharField(max_length=255)
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="outlets")

    class Meta:
        ordering = ["name"]
        unique_together = ("name", "route")

    def __str__(self) -> str:
        return f"{self.name} - {self.route.name}"


class Bill(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        CLEARED = "cleared", "Cleared"

    invoice_number = models.CharField(max_length=100, unique=True)
    invoice_date = models.DateField()
    outlet = models.ForeignKey(Outlet, on_delete=models.PROTECT, related_name="bills")
    brand = models.CharField(max_length=255)
    actual_amount = models.DecimalField(max_digits=12, decimal_places=2)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2)
    overdue_days = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_bills",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    cleared_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.invoice_number

    def refresh_overdue(self) -> None:
        self.overdue_days = calculate_overdue_days(self.invoice_date)

    def reconcile_status(self) -> None:
        if self.remaining_amount <= Decimal("0.00"):
            self.remaining_amount = Decimal("0.00")
            self.status = self.Status.CLEARED
            if self.cleared_at is None:
                from django.utils import timezone
                self.cleared_at = timezone.now()
        else:
            self.status = self.Status.OPEN
            self.cleared_at = None

    @property
    def outlet_name(self) -> str:
        return self.outlet.name

    @property
    def route_name(self) -> str:
        return self.outlet.route.name

    @property
    def assigned_to_name(self) -> str | None:
        return self.assigned_to.full_name if self.assigned_to else None

    def save(self, *args, **kwargs):
        self.refresh_overdue()
        self.reconcile_status()
        super().save(*args, **kwargs)


class BillImportJob(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bill_import_jobs",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    total_rows = models.PositiveIntegerField(default=0)
    processed_rows = models.PositiveIntegerField(default=0)
    imported = models.PositiveIntegerField(default=0)
    errors = models.JSONField(default=list, blank=True)
    error_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]