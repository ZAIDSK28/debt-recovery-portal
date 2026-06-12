# products/admin.py

from django.contrib import admin

from products.models import Product, ProductCategory, StockItem, StockMovement, Warehouse


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name",)


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
    search_fields = ("product_code", "name", "category__name")


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "location", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "location")


@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "warehouse", "quantity", "reorder_level", "updated_at")
    list_filter = ("warehouse",)
    search_fields = ("product__name", "product__product_code", "warehouse__name")


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "warehouse", "movement_type", "quantity", "created_at")
    list_filter = ("movement_type", "warehouse")
    search_fields = ("product__name", "product__product_code", "warehouse__name", "note")