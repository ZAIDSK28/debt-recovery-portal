# products/models.py

import random
import re

from django.conf import settings
from django.db import models


def _readable_suffix(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-zA-Z0-9]+", "", (name or "").upper())
    if not cleaned:
        return "PRD"

    vowels = {"A", "E", "I", "O", "U"}
    consonants = [ch for ch in cleaned if ch.isalpha() and ch not in vowels]

    if len(consonants) >= 3:
        return "".join(consonants[:3])

    combined = (cleaned + "XXX")[:3]
    return combined


def generate_product_code_from_name(name: str) -> str:
    suffix = _readable_suffix(name)
    number = random.randint(100, 999)
    return f"PRD-{number}{suffix}"


class ProductCategory(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Warehouse(models.Model):
    name = models.CharField(max_length=255, unique=True)
    location = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    product_code = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=255)
    category_ref = models.ForeignKey(
        ProductCategory,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="products",
    )
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    default_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name", "product_code"]

    def save(self, *args, **kwargs) -> None:
        if not self.product_code:
            candidate = generate_product_code_from_name(self.name)
            while Product.objects.filter(product_code=candidate).exclude(pk=self.pk).exists():
                candidate = generate_product_code_from_name(self.name)
            self.product_code = candidate

        if self.category_ref and not self.category:
            self.category = self.category_ref.name

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.product_code} - {self.name}"


class StockItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_items")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name="stock_items")
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reorder_level = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("product", "warehouse")
        ordering = ["warehouse__name", "product__name"]

    def __str__(self) -> str:
        return f"{self.product} @ {self.warehouse} ({self.quantity})"


class StockMovement(models.Model):
    class MovementType(models.TextChoices):
        IN = "in", "In"
        OUT = "out", "Out"
        ADJUSTMENT = "adjustment", "Adjustment"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_movements")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name="stock_movements")
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product", "warehouse"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.movement_type} {self.quantity} of {self.product} @ {self.warehouse}"


class StockTransfer(models.Model):
    """
    Represents an atomic movement of stock from one warehouse to another.
    On creation, two StockMovement records are auto-created (OUT from source,
    IN to destination) and the corresponding StockItem quantities are updated
    inside a database transaction.
    """

    source_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="outgoing_transfers",
    )
    destination_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="incoming_transfers",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="transfers",
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_transfers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["source_warehouse", "created_at"]),
            models.Index(fields=["destination_warehouse", "created_at"]),
            models.Index(fields=["product"]),
        ]

    def __str__(self) -> str:
        return (
            f"Transfer {self.quantity} of {self.product} "
            f"from {self.source_warehouse} to {self.destination_warehouse}"
        )