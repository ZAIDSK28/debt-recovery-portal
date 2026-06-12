# reports/serializers.py

from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from rest_framework import serializers

from bills.models import Bill
from products.models import Product, StockItem, StockMovement
from reports.models import InvoiceSequenceSetting, Party, PrintableInvoice, PrintableInvoiceItem
from reports.services import (
    build_payload_items,
    invoice_has_payments,
    replace_invoice_items,
    sync_invoice_to_bill,
)

TWOPLACES = Decimal("0.01")


def q(value: Decimal) -> Decimal:
    return value.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


# ─── Stock helpers ────────────────────────────────────────────────────────────

def _deduct_stock_for_items(computed_items: list[dict], invoice_number: str) -> None:
    """
    For each computed invoice item that has a linked Product, deduct the
    invoiced quantity from the warehouse that currently holds the most stock
    of that product.

    Rules:
    - If a StockItem record exists for this product (any active warehouse),
      deduct from the one with the highest on-hand quantity.
    - Stock is allowed to go to 0 but not below; if requested qty > on-hand,
      deduct only what is available and record the actual deducted amount.
    - If no StockItem exists for this product, skip silently — stock tracking
      may not yet be configured for every product.
    - All operations run inside the caller's transaction.atomic() block.
    """
    note = f"Invoice {invoice_number}"

    for item in computed_items:
        product: Product | None = item.get("product")
        quantity: Decimal = item.get("quantity", Decimal("0.00"))

        if product is None or quantity <= Decimal("0.00"):
            continue

        # Lock and fetch the best stock item (highest quantity) for this product
        stock_item: StockItem | None = (
            StockItem.objects.select_for_update()
            .filter(product=product, warehouse__is_active=True)
            .order_by("-quantity")
            .first()
        )

        if stock_item is None:
            # No stock record exists — skip without error
            continue

        deducted = min(quantity, stock_item.quantity)
        if deducted <= Decimal("0.00"):
            # Nothing to deduct (stock already at zero)
            continue

        stock_item.quantity -= deducted
        stock_item.save(update_fields=["quantity", "updated_at"])

        StockMovement.objects.create(
            product=product,
            warehouse=stock_item.warehouse,
            movement_type=StockMovement.MovementType.OUT,
            quantity=deducted,
            note=note,
        )


def _restore_stock_for_items(items_qs, invoice_number: str) -> None:
    """
    Return stock for an existing set of invoice items (used when invoice items
    are replaced during an edit).

    For each item, credit stock back to whichever warehouse last recorded an
    OUT movement for this product with the matching invoice note. If no such
    movement can be found, credit to the warehouse with the most stock of that
    product (fallback).
    """
    note = f"Invoice {invoice_number}"

    for item in items_qs:
        product: Product | None = item.product
        quantity: Decimal = item.quantity

        if product is None or quantity <= Decimal("0.00"):
            continue

        # Find the OUT movement we originally created for this invoice+product
        original_movement = (
            StockMovement.objects.filter(
                product=product,
                movement_type=StockMovement.MovementType.OUT,
                note=note,
            )
            .order_by("-id")
            .first()
        )

        if original_movement is not None:
            warehouse = original_movement.warehouse
        else:
            # Fallback: return to warehouse with most current stock
            stock_item = (
                StockItem.objects.filter(product=product, warehouse__is_active=True)
                .order_by("-quantity")
                .first()
            )
            if stock_item is None:
                continue
            warehouse = stock_item.warehouse

        stock_item, _ = StockItem.objects.select_for_update().get_or_create(
            product=product,
            warehouse=warehouse,
            defaults={"quantity": Decimal("0.00")},
        )
        stock_item.quantity += quantity
        stock_item.save(update_fields=["quantity", "updated_at"])

        StockMovement.objects.create(
            product=product,
            warehouse=warehouse,
            movement_type=StockMovement.MovementType.IN,
            quantity=quantity,
            note=f"Reversal — {note} (edit)",
        )


# ─── Party & sequence serializers ─────────────────────────────────────────────

class PartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = ["id", "name", "address", "phone", "email", "gst_number", "is_active", "created_at"]


class InvoiceSequenceSettingSerializer(serializers.ModelSerializer):
    preview_invoice_number = serializers.SerializerMethodField()

    class Meta:
        model = InvoiceSequenceSetting
        fields = [
            "id",
            "name",
            "prefix",
            "date_format",
            "separator",
            "next_number",
            "padding",
            "is_active",
            "updated_at",
            "preview_invoice_number",
        ]

    def get_preview_invoice_number(self, obj):
        return obj.generate_invoice_number()


# ─── Invoice item serializers ─────────────────────────────────────────────────

class PrintableInvoiceItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_code = serializers.CharField(source="product.product_code", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    category = serializers.CharField(source="product.category", read_only=True)

    class Meta:
        model = PrintableInvoiceItem
        fields = [
            "id",
            "product_id",
            "product_code",
            "product_name",
            "category",
            "description",
            "quantity",
            "rate",
            "tax_rate",
            "tax_amount",
            "amount",
            "line_total",
        ]


class PrintableInvoiceListSerializer(serializers.ModelSerializer):
    linked_bill_id = serializers.IntegerField(source="recovery_bill.id", read_only=True)
    party_id = serializers.IntegerField(source="party.id", read_only=True)

    class Meta:
        model = PrintableInvoice
        fields = [
            "id",
            "invoice_number",
            "invoice_date",
            "party_id",
            "customer_name",
            "route_name",
            "outlet_name",
            "brand",
            "subtotal",
            "tax_amount",
            "discount_amount",
            "total_amount",
            "creation_mode",
            "status",
            "linked_bill_id",
            "created_at",
            "updated_at",
        ]


class PrintableInvoiceDetailSerializer(serializers.ModelSerializer):
    items = PrintableInvoiceItemSerializer(many=True, read_only=True)
    linked_bill_id = serializers.IntegerField(source="recovery_bill.id", read_only=True)
    party_id = serializers.IntegerField(source="party.id", read_only=True)

    class Meta:
        model = PrintableInvoice
        fields = [
            "id",
            "invoice_number",
            "invoice_date",
            "party_id",
            "customer_name",
            "customer_address",
            "customer_phone",
            "gst_number",
            "route_name",
            "outlet_name",
            "brand",
            "subtotal",
            "tax_amount",
            "discount_amount",
            "total_amount",
            "notes",
            "terms",
            "creation_mode",
            "status",
            "linked_bill_id",
            "payload",
            "items",
            "created_at",
            "updated_at",
        ]


class PrintableInvoiceCreateItemInputSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        source="product",
    )
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_quantity(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value


# ─── Computation mixin ────────────────────────────────────────────────────────

class _InvoiceComputationMixin:
    def _compute(self, attrs):
        items = attrs.get("items") or []
        if not items:
            raise serializers.ValidationError({"items": "At least one product is required."})

        subtotal = Decimal("0.00")
        total_tax = Decimal("0.00")
        computed_items = []

        for item in items:
            product = item["product"]
            quantity = item["quantity"]

            amount = q(product.price * quantity)
            item_tax = q((amount * product.tax_rate) / Decimal("100.00"))
            line_total = q(amount + item_tax)

            subtotal += amount
            total_tax += item_tax

            computed_items.append(
                {
                    "product": product,
                    "description": product.name,
                    "quantity": quantity,
                    "rate": q(product.price),
                    "tax_rate": q(product.tax_rate),
                    "tax_amount": item_tax,
                    "amount": amount,
                    "line_total": line_total,
                }
            )

        subtotal = q(subtotal)
        total_tax = q(total_tax)
        discount_amount = q(attrs.get("discount_amount", Decimal("0.00")))
        total_amount = q(subtotal + total_tax - discount_amount)

        if total_amount < Decimal("0.00"):
            raise serializers.ValidationError(
                {"discount_amount": "Discount amount cannot exceed invoice total."}
            )

        attrs["_computed_items"] = computed_items
        attrs["_subtotal"] = subtotal
        attrs["_tax_amount"] = total_tax
        attrs["_total_amount"] = total_amount
        attrs["_discount_amount"] = discount_amount
        return attrs

    def _apply_party_defaults(self, attrs):
        party = attrs.get("party")
        if not party:
            return attrs

        attrs["customer_name"] = attrs.get("customer_name") or party.name
        attrs["customer_address"] = attrs.get("customer_address") or party.address
        attrs["customer_phone"] = attrs.get("customer_phone") or party.phone
        attrs["gst_number"] = attrs.get("gst_number") or party.gst_number
        return attrs

    def _ensure_invoice_number(self, attrs, instance=None):
        if attrs.get("invoice_number"):
            return attrs

        setting = InvoiceSequenceSetting.objects.select_for_update().get(
            pk=InvoiceSequenceSetting.get_active().pk
        )
        generated = setting.generate_invoice_number()

        while PrintableInvoice.objects.filter(invoice_number=generated).exclude(
            pk=getattr(instance, "pk", None)
        ).exists():
            setting.next_number += 1
            generated = setting.generate_invoice_number()

        attrs["invoice_number"] = generated
        setting.next_number += 1
        setting.save(update_fields=["next_number", "updated_at"])
        return attrs

    def _compute_from_existing_items(self, invoice, attrs):
        existing_items = [
            {"product": item.product, "quantity": item.quantity}
            for item in invoice.items.select_related("product").all()
        ]
        merged = {
            "items": existing_items,
            "discount_amount": attrs.get("discount_amount", invoice.discount_amount),
        }
        return self._compute(merged)


# ─── Create serializer ────────────────────────────────────────────────────────

class PrintableInvoiceCreateSerializer(_InvoiceComputationMixin, serializers.Serializer):
    invoice_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    invoice_date = serializers.DateField()

    party_id = serializers.PrimaryKeyRelatedField(
        queryset=Party.objects.filter(is_active=True),
        source="party",
        required=False,
        allow_null=True,
    )

    customer_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    customer_address = serializers.CharField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(required=False, allow_blank=True)
    gst_number = serializers.CharField(required=False, allow_blank=True)

    route_name = serializers.CharField(required=False, allow_blank=True)
    outlet_name = serializers.CharField(required=False, allow_blank=True)
    brand = serializers.CharField(required=False, allow_blank=True)

    discount_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=Decimal("0.00")
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    terms = serializers.CharField(required=False, allow_blank=True)

    creation_mode = serializers.ChoiceField(choices=PrintableInvoice.CreationMode.choices)
    items = PrintableInvoiceCreateItemInputSerializer(many=True)

    def validate_invoice_number(self, value):
        if not value:
            return value
        if PrintableInvoice.objects.filter(invoice_number=value).exists():
            raise serializers.ValidationError("Invoice number already exists.")
        return value

    def validate_discount_amount(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError("Discount amount cannot be negative.")
        return value

    def validate(self, attrs):
        attrs = self._apply_party_defaults(attrs)

        if not attrs.get("customer_name"):
            raise serializers.ValidationError({"customer_name": "customer_name is required."})

        if attrs["creation_mode"] in [
            PrintableInvoice.CreationMode.BILL_ONLY,
            PrintableInvoice.CreationMode.PRINTABLE_AND_BILL,
        ]:
            for field in ["route_name", "outlet_name", "brand"]:
                if not attrs.get(field):
                    raise serializers.ValidationError(
                        {field: f"{field} is required for bill creation."}
                    )

            invoice_number = attrs.get("invoice_number")
            if invoice_number and Bill.objects.filter(invoice_number=invoice_number).exists():
                raise serializers.ValidationError(
                    {"invoice_number": "Invoice number already exists."}
                )

        return self._compute(attrs)

    def create(self, validated_data):
        request = self.context["request"]

        computed_items = validated_data.pop("_computed_items")
        subtotal = validated_data.pop("_subtotal")
        tax_amount = validated_data.pop("_tax_amount")
        total_amount = validated_data.pop("_total_amount")
        discount_amount = validated_data.pop("_discount_amount")

        with transaction.atomic():
            validated_data = self._ensure_invoice_number(validated_data)

            validated_data.pop("items", None)
            validated_data.pop("discount_amount", None)

            printable_invoice = PrintableInvoice.objects.create(
                created_by=request.user,
                payload={"items": build_payload_items(computed_items)},
                subtotal=subtotal,
                tax_amount=tax_amount,
                discount_amount=discount_amount,
                total_amount=total_amount,
                status=PrintableInvoice.Status.FINALIZED,
                **validated_data,
            )

            replace_invoice_items(printable_invoice, computed_items)

            # Deduct stock for each product line item
            _deduct_stock_for_items(computed_items, printable_invoice.invoice_number)

            sync_invoice_to_bill(printable_invoice)

        return printable_invoice


# ─── Update serializer ────────────────────────────────────────────────────────

class PrintableInvoiceUpdateSerializer(_InvoiceComputationMixin, serializers.Serializer):
    invoice_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    invoice_date = serializers.DateField(required=False)

    party_id = serializers.PrimaryKeyRelatedField(
        queryset=Party.objects.filter(is_active=True),
        source="party",
        required=False,
        allow_null=True,
    )

    customer_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    customer_address = serializers.CharField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(required=False, allow_blank=True)
    gst_number = serializers.CharField(required=False, allow_blank=True)
    route_name = serializers.CharField(required=False, allow_blank=True)
    outlet_name = serializers.CharField(required=False, allow_blank=True)
    brand = serializers.CharField(required=False, allow_blank=True)
    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    terms = serializers.CharField(required=False, allow_blank=True)
    creation_mode = serializers.ChoiceField(
        choices=PrintableInvoice.CreationMode.choices, required=False
    )
    items = PrintableInvoiceCreateItemInputSerializer(many=True, required=False)

    def validate_invoice_number(self, value):
        if not value:
            return value
        qs = PrintableInvoice.objects.filter(invoice_number=value)
        if self.instance is not None:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("Invoice number already exists.")
        return value

    def validate_discount_amount(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError("Discount amount cannot be negative.")
        return value

    def validate(self, attrs):
        invoice = self.instance

        if invoice_has_payments(invoice):
            raise serializers.ValidationError(
                {"detail": "Invoice cannot be edited after the first payment is recorded."}
            )

        attrs = self._apply_party_defaults(attrs)

        merged = {
            "invoice_number": attrs.get("invoice_number", invoice.invoice_number),
            "invoice_date": attrs.get("invoice_date", invoice.invoice_date),
            "party": attrs.get("party", invoice.party),
            "customer_name": attrs.get("customer_name", invoice.customer_name),
            "customer_address": attrs.get("customer_address", invoice.customer_address),
            "customer_phone": attrs.get("customer_phone", invoice.customer_phone),
            "gst_number": attrs.get("gst_number", invoice.gst_number),
            "route_name": attrs.get("route_name", invoice.route_name),
            "outlet_name": attrs.get("outlet_name", invoice.outlet_name),
            "brand": attrs.get("brand", invoice.brand),
            "discount_amount": attrs.get("discount_amount", invoice.discount_amount),
            "notes": attrs.get("notes", invoice.notes),
            "terms": attrs.get("terms", invoice.terms),
            "creation_mode": attrs.get("creation_mode", invoice.creation_mode),
        }

        if not merged.get("customer_name"):
            raise serializers.ValidationError({"customer_name": "customer_name is required."})

        if merged["creation_mode"] in [
            PrintableInvoice.CreationMode.BILL_ONLY,
            PrintableInvoice.CreationMode.PRINTABLE_AND_BILL,
        ]:
            for field in ["route_name", "outlet_name", "brand"]:
                if not merged.get(field):
                    raise serializers.ValidationError(
                        {field: f"{field} is required for bill creation."}
                    )

        if "items" in attrs:
            merged["items"] = attrs["items"]
            return self._compute(merged)

        if "discount_amount" in attrs:
            computed = self._compute_from_existing_items(invoice, attrs)
            attrs.update(
                {
                    "_computed_items": computed["_computed_items"],
                    "_subtotal": computed["_subtotal"],
                    "_tax_amount": computed["_tax_amount"],
                    "_total_amount": computed["_total_amount"],
                    "_discount_amount": computed["_discount_amount"],
                }
            )

        return attrs

    def update(self, instance: PrintableInvoice, validated_data: dict):
        computed_items = validated_data.pop("_computed_items", None)
        subtotal = validated_data.pop("_subtotal", None)
        tax_amount = validated_data.pop("_tax_amount", None)
        total_amount = validated_data.pop("_total_amount", None)
        discount_amount = validated_data.pop("_discount_amount", None)
        validated_data.pop("items", None)

        items_are_changing = computed_items is not None

        with transaction.atomic():
            if not validated_data.get("invoice_number", instance.invoice_number):
                validated_data = self._ensure_invoice_number(validated_data, instance=instance)

            # Capture old items BEFORE replacing them so we can restore their stock
            if items_are_changing:
                old_items = list(instance.items.select_related("product").all())

            for field, value in validated_data.items():
                setattr(instance, field, value)

            if items_are_changing:
                instance.subtotal = subtotal
                instance.tax_amount = tax_amount
                instance.total_amount = total_amount
                instance.discount_amount = discount_amount
                instance.payload = {"items": build_payload_items(computed_items)}

            instance.save()

            if items_are_changing:
                # 1. Restore stock consumed by the old item set
                _restore_stock_for_items(old_items, instance.invoice_number)

                # 2. Replace the item rows
                replace_invoice_items(instance, computed_items)

                # 3. Deduct stock for the new item set
                _deduct_stock_for_items(computed_items, instance.invoice_number)

            sync_invoice_to_bill(instance)

        return instance