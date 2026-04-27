# products/admin.py

from django.contrib import admin

from products.models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "product_code",
        "name",
        "category",
        "price",
        "default_quantity",
        "tax_rate",
        "is_active",
        "created_at",
    )
    list_filter = ("category", "is_active")
    search_fields = ("product_code", "name", "category")