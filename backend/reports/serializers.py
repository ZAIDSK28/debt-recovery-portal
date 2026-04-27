# reports/serializers.py

from decimal import Decimal, ROUND_HALF_UP

from rest_framework import serializers

from bills.models import Bill, Outlet, Route
from products.models import Product
from reports.models import PrintableInvoice, PrintableInvoiceItem


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
    linked_bill_id = serializers.IntegerField(source="linked_bill.id", read_only=True)

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
            "linked_bill_id",
            "created_at",
        ]


class PrintableInvoiceDetailSerializer(serializers.ModelSerializer):
    items = PrintableInvoiceItemSerializer(many=True, read_only=True)
    linked_bill_id = serializers.IntegerField(source="linked_bill.id", read_only=True)

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
            "linked_bill_id",
            "payload",
            "items",
            "created_at",
        ]


class PrintableInvoiceCreateItemInputSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True), source="product")
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_quantity(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value


class PrintableInvoiceCreateSerializer(serializers.Serializer):
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

    creation_mode = serializers.ChoiceField(
        choices=PrintableInvoice.CreationMode.choices
    )

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
            required_bill_fields = ["route_name", "outlet_name", "brand"]
            for field in required_bill_fields:
                if not attrs.get(field):
                    raise serializers.ValidationError({field: f"{field} is required for bill creation."})

            invoice_number = attrs.get("invoice_number")
            if invoice_number and Bill.objects.filter(invoice_number=invoice_number).exists():
                raise serializers.ValidationError({"invoice_number": "Invoice number already exists."})

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

    def create(self, validated_data):
        request = self.context["request"]
        creation_mode = validated_data["creation_mode"]

        computed_items = validated_data.pop("_computed_items")
        subtotal = validated_data.pop("_subtotal")
        tax_amount = validated_data.pop("_tax_amount")
        total_amount = validated_data.pop("_total_amount")
        discount_amount = validated_data.pop("_discount_amount")

        validated_data.pop("items", None)
        validated_data.pop("discount_amount", None)

        linked_bill = None

        if creation_mode in [
            PrintableInvoice.CreationMode.BILL_ONLY,
            PrintableInvoice.CreationMode.PRINTABLE_AND_BILL,
        ]:
            route, _ = Route.objects.get_or_create(name=validated_data["route_name"])
            outlet, _ = Outlet.objects.get_or_create(
                name=validated_data["outlet_name"],
                route=route,
            )
            linked_bill = Bill.objects.create(
                invoice_number=validated_data["invoice_number"],
                invoice_date=validated_data["invoice_date"],
                outlet=outlet,
                brand=validated_data["brand"],
                actual_amount=total_amount,
                remaining_amount=total_amount,
            )

        payload_items = [
            {
                "product_id": item["product"].id,
                "product_code": item["product"].product_code,
                "product_name": item["product"].name,
                "category": item["product"].category,
                "description": item["description"],
                "quantity": str(item["quantity"]),
                "rate": str(item["rate"]),
                "tax_rate": str(item["tax_rate"]),
                "tax_amount": str(item["tax_amount"]),
                "amount": str(item["amount"]),
                "line_total": str(item["line_total"]),
            }
            for item in computed_items
        ]

        printable_invoice = PrintableInvoice.objects.create(
            created_by=request.user,
            linked_bill=linked_bill,
            payload={"items": payload_items},
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            total_amount=total_amount,
            **validated_data,
        )

        for item in computed_items:
            PrintableInvoiceItem.objects.create(invoice=printable_invoice, **item)

        return printable_invoice