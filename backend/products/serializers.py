# products/serializers.py

from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from products.models import (
    Product,
    ProductCategory,
    StockItem,
    StockMovement,
    StockTransfer,
    Warehouse,
)


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ["id", "name", "description", "is_active", "created_at"]


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ["id", "name", "location", "is_active", "created_at"]


class ProductSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductCategory.objects.filter(is_active=True),
        source="category_ref",
        required=False,
        allow_null=True,
    )
    category_name = serializers.CharField(source="category_ref.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "product_code",
            "category",
            "category_id",
            "category_name",
            "name",
            "price",
            "default_quantity",
            "tax_rate",
            "is_active",
            "created_at",
        ]

    def validate_product_code(self, value: str) -> str:
        return (value or "").strip()

    def validate_price(self, value: Decimal) -> Decimal:
        if value < Decimal("0.00"):
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_default_quantity(self, value: Decimal) -> Decimal:
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Default quantity must be greater than zero.")
        return value

    def validate_tax_rate(self, value: Decimal) -> Decimal:
        if value < Decimal("0.00"):
            raise serializers.ValidationError("Tax rate cannot be negative.")
        return value

    def create(self, validated_data: dict) -> Product:
        category_ref = validated_data.get("category_ref")
        if category_ref and not validated_data.get("category"):
            validated_data["category"] = category_ref.name
        return super().create(validated_data)

    def update(self, instance: Product, validated_data: dict) -> Product:
        category_ref = validated_data.get("category_ref", instance.category_ref)
        if category_ref and not validated_data.get("category"):
            validated_data["category"] = category_ref.name
        return super().update(instance, validated_data)


class StockItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_code = serializers.CharField(source="product.product_code", read_only=True)
    category_name = serializers.CharField(source="product.category_ref.name", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = StockItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_code",
            "category_name",
            "warehouse",
            "warehouse_name",
            "quantity",
            "reorder_level",
            "is_low_stock",
            "updated_at",
        ]

    def get_is_low_stock(self, obj: StockItem) -> bool:
        return obj.quantity <= obj.reorder_level


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "product",
            "product_name",
            "warehouse",
            "warehouse_name",
            "movement_type",
            "quantity",
            "note",
            "created_at",
        ]

    def validate_quantity(self, value: Decimal) -> Decimal:
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

    def validate(self, attrs: dict) -> dict:
        product: Product = attrs.get("product") or getattr(self.instance, "product", None)
        warehouse: Warehouse = attrs.get("warehouse") or getattr(self.instance, "warehouse", None)

        if product and not product.is_active:
            raise serializers.ValidationError(
                {"product": "Cannot record a movement for an inactive product."}
            )
        if warehouse and not warehouse.is_active:
            raise serializers.ValidationError(
                {"warehouse": "Cannot record a movement for an inactive warehouse."}
            )
        return attrs

    def create(self, validated_data: dict) -> StockMovement:
        with transaction.atomic():
            stock_item, _ = StockItem.objects.select_for_update().get_or_create(
                product=validated_data["product"],
                warehouse=validated_data["warehouse"],
                defaults={"quantity": Decimal("0.00")},
            )

            movement_type = validated_data["movement_type"]
            quantity = validated_data["quantity"]

            if movement_type == StockMovement.MovementType.OUT and quantity > stock_item.quantity:
                raise serializers.ValidationError(
                    {"quantity": f"Insufficient stock. Available: {stock_item.quantity}."}
                )

            movement = StockMovement.objects.create(**validated_data)

            if movement_type == StockMovement.MovementType.IN:
                stock_item.quantity += quantity
            elif movement_type == StockMovement.MovementType.OUT:
                stock_item.quantity -= quantity
            else:
                # ADJUSTMENT sets absolute quantity
                stock_item.quantity = quantity

            stock_item.save(update_fields=["quantity", "updated_at"])
            return movement


class StockTransferSerializer(serializers.ModelSerializer):
    source_warehouse_name = serializers.CharField(
        source="source_warehouse.name", read_only=True
    )
    destination_warehouse_name = serializers.CharField(
        source="destination_warehouse.name", read_only=True
    )
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_code = serializers.CharField(source="product.product_code", read_only=True)
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True, default=""
    )

    class Meta:
        model = StockTransfer
        fields = [
            "id",
            "source_warehouse",
            "source_warehouse_name",
            "destination_warehouse",
            "destination_warehouse_name",
            "product",
            "product_name",
            "product_code",
            "quantity",
            "note",
            "created_by",
            "created_by_username",
            "created_at",
        ]
        read_only_fields = ["created_by", "created_at"]

    def validate_quantity(self, value: Decimal) -> Decimal:
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Transfer quantity must be greater than zero.")
        return value

    def validate(self, attrs: dict) -> dict:
        source: Warehouse = attrs.get("source_warehouse")
        destination: Warehouse = attrs.get("destination_warehouse")
        product: Product = attrs.get("product")
        quantity: Decimal = attrs.get("quantity", Decimal("0.00"))

        if source and destination and source.pk == destination.pk:
            raise serializers.ValidationError(
                {"destination_warehouse": "Source and destination warehouses must be different."}
            )

        if source and not source.is_active:
            raise serializers.ValidationError(
                {"source_warehouse": "Source warehouse is inactive."}
            )
        if destination and not destination.is_active:
            raise serializers.ValidationError(
                {"destination_warehouse": "Destination warehouse is inactive."}
            )
        if product and not product.is_active:
            raise serializers.ValidationError(
                {"product": "Cannot transfer an inactive product."}
            )

        # Validate available stock in source warehouse
        if source and product:
            try:
                source_stock = StockItem.objects.get(product=product, warehouse=source)
            except StockItem.DoesNotExist:
                raise serializers.ValidationError(
                    {"quantity": "No stock record found for this product in the source warehouse."}
                )
            if quantity > source_stock.quantity:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            f"Insufficient stock in source warehouse. "
                            f"Available: {source_stock.quantity}."
                        )
                    }
                )

        return attrs

    def create(self, validated_data: dict) -> StockTransfer:
        from core.utils import create_audit_log

        source_warehouse: Warehouse = validated_data["source_warehouse"]
        destination_warehouse: Warehouse = validated_data["destination_warehouse"]
        product: Product = validated_data["product"]
        quantity: Decimal = validated_data["quantity"]
        note: str = validated_data.get("note", "")
        created_by = validated_data.get("created_by")

        transfer_note = f"Transfer #{{}}: {note}".strip(": ")

        with transaction.atomic():
            # Lock both stock item rows to prevent concurrent race conditions
            source_item = StockItem.objects.select_for_update().get(
                product=product,
                warehouse=source_warehouse,
            )
            dest_item, _ = StockItem.objects.select_for_update().get_or_create(
                product=product,
                warehouse=destination_warehouse,
                defaults={"quantity": Decimal("0.00")},
            )

            # Re-validate after acquiring lock (guard against TOCTOU)
            if quantity > source_item.quantity:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            f"Insufficient stock after acquiring lock. "
                            f"Available: {source_item.quantity}."
                        )
                    }
                )

            transfer = StockTransfer.objects.create(**validated_data)

            # Update the note now that we have the transfer PK
            transfer_note = f"Transfer #{transfer.pk}"
            if note:
                transfer_note = f"{transfer_note}: {note}"

            # Deduct from source
            source_item.quantity -= quantity
            source_item.save(update_fields=["quantity", "updated_at"])

            # Credit destination
            dest_item.quantity += quantity
            dest_item.save(update_fields=["quantity", "updated_at"])

            # Create audit trail via StockMovement records
            StockMovement.objects.create(
                product=product,
                warehouse=source_warehouse,
                movement_type=StockMovement.MovementType.OUT,
                quantity=quantity,
                note=transfer_note,
            )
            StockMovement.objects.create(
                product=product,
                warehouse=destination_warehouse,
                movement_type=StockMovement.MovementType.IN,
                quantity=quantity,
                note=transfer_note,
            )

            create_audit_log(
                actor=created_by,
                action="stock.transfer.created",
                entity_type="StockTransfer",
                entity_id=str(transfer.pk),
                metadata={
                    "source_warehouse_id": source_warehouse.pk,
                    "source_warehouse_name": source_warehouse.name,
                    "destination_warehouse_id": destination_warehouse.pk,
                    "destination_warehouse_name": destination_warehouse.name,
                    "product_id": product.pk,
                    "product_name": product.name,
                    "quantity": str(quantity),
                },
            )

        return transfer