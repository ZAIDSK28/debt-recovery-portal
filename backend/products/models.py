# products/models.py

from django.db import models


class Product(models.Model):
    product_code = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    default_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name", "product_code"]

    def __str__(self):
        return f"{self.product_code} - {self.name}"