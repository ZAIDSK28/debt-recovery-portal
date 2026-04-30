# reports/serializers.py

from decimal import Decimal, ROUND_HALF_UP

from rest_framework import serializers

from bills.models import Bill
from products.models import Product
from reports.models import PrintableInvoice, PrintableInvoiceItem
from reports.services import (
    build_payload_items,
    invoice_has_payments,
    replace_invoice_items,
    sync_invoice_to_bill,
)


TWOPLACES = Decimal("0.01")


def q(value: Decimal) -> Decimal:
    return value.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


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

    class Meta:
        model = PrintableInvoice
        fields = [
            "id",
            "invoice_number",
            "invoice_date",
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

    class Meta:
        model = PrintableInvoice
        fields = [
            "id",
            "invoice_number",
            "invoice_date",
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
            raise serializers.ValidationError({"discount_amount": "Discount amount cannot exceed invoice total."})

        attrs["_computed_items"] = computed_items
        attrs["_subtotal"] = subtotal
        attrs["_tax_amount"] = total_tax
        attrs["_total_amount"] = total_amount
        attrs["_discount_amount"] = discount_amount
        return attrs

    def _compute_from_existing_items(self, invoice, attrs):
        existing_items = [
            {
                "product": item.product,
                "quantity": item.quantity,
            }
            for item in invoice.items.select_related("product").all()
            if item.product is not None
        ]
        return self._compute(
            {
                "items": existing_items,
                "discount_amount": attrs.get("discount_amount", invoice.discount_amount),
            }
        )


class PrintableInvoiceCreateSerializer(_InvoiceComputationMixin, serializers.Serializer):
    invoice_number = serializers.CharField(max_length=100)
    invoice_date = serializers.DateField()

    customer_name = serializers.CharField(max_length=255)
    customer_address = serializers.CharField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(required=False, allow_blank=True)
    gst_number = serializers.CharField(required=False, allow_blank=True)

    route_name = serializers.CharField(required=False, allow_blank=True)
    outlet_name = serializers.CharField(required=False, allow_blank=True)
    brand = serializers.CharField(required=False, allow_blank=True)

    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=Decimal("0.00"))
    notes = serializers.CharField(required=False, allow_blank=True)
    terms = serializers.CharField(required=False, allow_blank=True)

    creation_mode = serializers.ChoiceField(choices=PrintableInvoice.CreationMode.choices)
    items = PrintableInvoiceCreateItemInputSerializer(many=True)

    def validate_invoice_number(self, value):
        if PrintableInvoice.objects.filter(invoice_number=value).exists():
            raise serializers.ValidationError("Invoice number already exists.")
        return value

    def validate_discount_amount(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError("Discount amount cannot be negative.")
        return value

    def validate(self, attrs):
        if attrs["creation_mode"] in [
            PrintableInvoice.CreationMode.BILL_ONLY,
            PrintableInvoice.CreationMode.PRINTABLE_AND_BILL,
        ]:
            for field in ["route_name", "outlet_name", "brand"]:
                if not attrs.get(field):
                    raise serializers.ValidationError({field: f"{field} is required for bill creation."})

            invoice_number = attrs.get("invoice_number")
            if invoice_number and Bill.objects.filter(invoice_number=invoice_number).exists():
                raise serializers.ValidationError({"invoice_number": "Invoice number already exists."})

        return self._compute(attrs)

    def create(self, validated_data):
        request = self.context["request"]

        computed_items = validated_data.pop("_computed_items")
        subtotal = validated_data.pop("_subtotal")
        tax_amount = validated_data.pop("_tax_amount")
        total_amount = validated_data.pop("_total_amount")
        discount_amount = validated_data.pop("_discount_amount")

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
        sync_invoice_to_bill(printable_invoice)
        return printable_invoice


class PrintableInvoiceUpdateSerializer(_InvoiceComputationMixin, serializers.Serializer):
    invoice_number = serializers.CharField(max_length=100, required=False)
    invoice_date = serializers.DateField(required=False)
    customer_name = serializers.CharField(max_length=255, required=False)
    customer_address = serializers.CharField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(required=False, allow_blank=True)
    gst_number = serializers.CharField(required=False, allow_blank=True)
    route_name = serializers.CharField(required=False, allow_blank=True)
    outlet_name = serializers.CharField(required=False, allow_blank=True)
    brand = serializers.CharField(required=False, allow_blank=True)
    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    terms = serializers.CharField(required=False, allow_blank=True)
    creation_mode = serializers.ChoiceField(choices=PrintableInvoice.CreationMode.choices, required=False)
    items = PrintableInvoiceCreateItemInputSerializer(many=True, required=False)

    def validate_invoice_number(self, value):
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

        merged = {
            "invoice_number": attrs.get("invoice_number", invoice.invoice_number),
            "invoice_date": attrs.get("invoice_date", invoice.invoice_date),
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

        if merged["creation_mode"] in [
            PrintableInvoice.CreationMode.BILL_ONLY,
            PrintableInvoice.CreationMode.PRINTABLE_AND_BILL,
        ]:
            for field in ["route_name", "outlet_name", "brand"]:
                if not merged.get(field):
                    raise serializers.ValidationError({field: f"{field} is required for bill creation."})

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

    def update(self, instance, validated_data):
        computed_items = validated_data.pop("_computed_items", None)
        subtotal = validated_data.pop("_subtotal", None)
        tax_amount = validated_data.pop("_tax_amount", None)
        total_amount = validated_data.pop("_total_amount", None)
        discount_amount = validated_data.pop("_discount_amount", None)
        validated_data.pop("items", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if computed_items is not None:
            instance.subtotal = subtotal
            instance.tax_amount = tax_amount
            instance.total_amount = total_amount
            instance.discount_amount = discount_amount
            instance.payload = {"items": build_payload_items(computed_items)}

        instance.save()

        if computed_items is not None:
            replace_invoice_items(instance, computed_items)

        sync_invoice_to_bill(instance)
        return instance