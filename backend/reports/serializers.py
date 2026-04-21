# reports/serializers.py

from decimal import Decimal

from rest_framework import serializers

from bills.models import Bill, Outlet, Route
from reports.models import PrintableInvoice, PrintableInvoiceItem


class PrintableInvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrintableInvoiceItem
        fields = ["id", "description", "quantity", "rate", "amount"]


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

    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=Decimal("0.00"))
    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=Decimal("0.00"))
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)

    notes = serializers.CharField(required=False, allow_blank=True)
    terms = serializers.CharField(required=False, allow_blank=True)

    creation_mode = serializers.ChoiceField(
        choices=PrintableInvoice.CreationMode.choices
    )

    items = PrintableInvoiceItemSerializer(many=True, required=False)

    def validate_invoice_number(self, value):
        if PrintableInvoice.objects.filter(invoice_number=value).exists():
            raise serializers.ValidationError("Invoice number already exists.")
        return value

    def validate(self, attrs):
        subtotal = attrs.get("subtotal", Decimal("0.00"))
        tax_amount = attrs.get("tax_amount", Decimal("0.00"))
        discount_amount = attrs.get("discount_amount", Decimal("0.00"))
        total_amount = attrs.get("total_amount", Decimal("0.00"))

        expected_total = subtotal + tax_amount - discount_amount
        if total_amount != expected_total:
            raise serializers.ValidationError(
                {"total_amount": "Total amount must equal subtotal + tax_amount - discount_amount."}
            )

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

        return attrs

    def _serialize_items_for_payload(self, items_data):
        serialized_items = []
        for item in items_data:
            serialized_items.append(
                {
                    "description": item.get("description", ""),
                    "quantity": str(item.get("quantity", Decimal("0.00"))),
                    "rate": str(item.get("rate", Decimal("0.00"))),
                    "amount": str(item.get("amount", Decimal("0.00"))),
                }
            )
        return serialized_items

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        request = self.context["request"]
        creation_mode = validated_data["creation_mode"]

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
                actual_amount=validated_data["total_amount"],
                remaining_amount=validated_data["total_amount"],
            )

        payload_items = self._serialize_items_for_payload(items_data)

        printable_invoice = PrintableInvoice.objects.create(
            created_by=request.user,
            linked_bill=linked_bill,
            payload={"items": payload_items},
            **validated_data,
        )

        for item in items_data:
            PrintableInvoiceItem.objects.create(invoice=printable_invoice, **item)

        return printable_invoice