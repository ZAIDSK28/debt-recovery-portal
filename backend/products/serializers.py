# products/serializers.py

from decimal import Decimal

from rest_framework import serializers

from products.models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "product_code",
            "category",
            "name",
            "price",
            "default_quantity",
            "tax_rate",
            "is_active",
            "created_at",
        ]

    def validate_price(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_default_quantity(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Default quantity must be greater than zero.")
        return value

    def validate_tax_rate(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError("Tax rate cannot be negative.")
        return value