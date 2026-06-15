# reports/services.py

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Q

from bills.models import Bill, Outlet, Route
from payments.services import reconcile_bill_from_payments
from products.models import StockItem, StockMovement, Warehouse
from reports.models import PrintableInvoice, PrintableInvoiceItem

TWOPLACES = Decimal("0.01")


def q(value: Decimal) -> Decimal:
    return value.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def build_payload_items(computed_items):
    return [
        {
            "product_id": item["product"].id,
            "product_code": item["product"].product_code,
            "product_name": item["product"].name,
            "category": item["product"].category,
            "warehouse_id": item["warehouse"].id,
            "warehouse_name": item["warehouse"].name,
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


def get_invoice_bill(invoice: PrintableInvoice) -> Bill | None:
    return getattr(invoice, "recovery_bill", None)


def invoice_has_payments(invoice: PrintableInvoice) -> bool:
    recovery_bill = get_invoice_bill(invoice)
    return bool(recovery_bill and recovery_bill.payments.exists())


@transaction.atomic
def sync_invoice_to_bill(invoice: PrintableInvoice) -> Bill | None:
    if invoice.creation_mode == PrintableInvoice.CreationMode.PRINTABLE_ONLY:
        recovery_bill = get_invoice_bill(invoice)
        if recovery_bill:
            recovery_bill.delete()
        return None

    route, _ = Route.objects.get_or_create(name=invoice.route_name)
    outlet, _ = Outlet.objects.get_or_create(
        name=invoice.outlet_name,
        route=route,
    )

    recovery_bill = get_invoice_bill(invoice)

    if recovery_bill is None:
        return Bill.objects.create(
            invoice=invoice,
            invoice_number=invoice.invoice_number,
            invoice_date=invoice.invoice_date,
            outlet=outlet,
            brand=invoice.brand,
            actual_amount=invoice.total_amount,
            remaining_amount=invoice.total_amount,
        )

    recovery_bill.invoice_number = invoice.invoice_number
    recovery_bill.invoice_date = invoice.invoice_date
    recovery_bill.outlet = outlet
    recovery_bill.brand = invoice.brand
    recovery_bill.actual_amount = invoice.total_amount

    if recovery_bill.payments.exists():
        recovery_bill.save()
        reconcile_bill_from_payments(recovery_bill)
    else:
        recovery_bill.remaining_amount = invoice.total_amount
        recovery_bill.save()

    return recovery_bill


@transaction.atomic
def replace_invoice_items(invoice: PrintableInvoice, computed_items: list[dict]) -> None:
    invoice.items.all().delete()
    PrintableInvoiceItem.objects.bulk_create(
        [
            PrintableInvoiceItem(
                invoice=invoice,
                product=item["product"],
                warehouse=item["warehouse"],
                description=item["description"],
                quantity=item["quantity"],
                rate=item["rate"],
                tax_rate=item["tax_rate"],
                tax_amount=item["tax_amount"],
                amount=item["amount"],
                line_total=item["line_total"],
            )
            for item in computed_items
        ]
    )


# ----------------------------------------------------------------------
# Stock validation and deduction (with warehouse selection)
# ----------------------------------------------------------------------

def validate_stock_for_items(computed_items: list[dict]) -> None:
    """
    Validate that for each line item, the specified warehouse has enough stock.
    Raises ValidationError listing every line item that fails.
    """
    from rest_framework import serializers

    errors: list[str] = []

    for item in computed_items:
        product = item.get("product")
        warehouse = item.get("warehouse")
        quantity = item.get("quantity", Decimal("0.00"))

        if product is None or quantity <= Decimal("0.00"):
            continue

        if warehouse is None:
            errors.append(
                f"Warehouse not specified for product '{product.name}' ({product.product_code})."
            )
            continue

        try:
            stock_item = StockItem.objects.get(product=product, warehouse=warehouse)
        except StockItem.DoesNotExist:
            errors.append(
                f"Product '{product.name}' ({product.product_code}) has no stock record "
                f"in warehouse '{warehouse.name}'."
            )
            continue

        if stock_item.quantity <= Decimal("0.00"):
            errors.append(
                f"Product '{product.name}' ({product.product_code}) is out of stock "
                f"in warehouse '{warehouse.name}'."
            )
        elif quantity > stock_item.quantity:
            errors.append(
                f"Product '{product.name}' ({product.product_code}): requested {quantity}, "
                f"only {stock_item.quantity} available in warehouse '{warehouse.name}'."
            )

    if errors:
        raise serializers.ValidationError({"items": errors})


def deduct_stock_for_items(computed_items: list[dict], invoice_number: str) -> None:
    """
    Deduct stock from the specified warehouses inside a transaction.
    Uses select_for_update() to prevent race conditions.
    """
    from rest_framework import serializers

    note = f"Invoice {invoice_number}"

    for item in computed_items:
        product = item.get("product")
        warehouse = item.get("warehouse")
        quantity = item.get("quantity", Decimal("0.00"))

        if product is None or quantity <= Decimal("0.00"):
            continue

        # Lock the specific StockItem row
        try:
            stock_item = StockItem.objects.select_for_update().get(
                product=product, warehouse=warehouse
            )
        except StockItem.DoesNotExist:
            raise serializers.ValidationError(
                {
                    "items": (
                        f"Stock record for product '{product.name}' in warehouse "
                        f"'{warehouse.name}' disappeared between validation and save."
                    )
                }
            )

        if stock_item.quantity < quantity:
            raise serializers.ValidationError(
                {
                    "items": (
                        f"Insufficient stock for '{product.name}' in warehouse "
                        f"'{warehouse.name}' after acquiring lock. Available: {stock_item.quantity}."
                    )
                }
            )

        stock_item.quantity -= quantity
        stock_item.save(update_fields=["quantity", "updated_at"])

        StockMovement.objects.create(
            product=product,
            warehouse=warehouse,
            movement_type=StockMovement.MovementType.OUT,
            quantity=quantity,
            note=note,
        )


def restore_stock_for_items(items_qs, invoice_number: str) -> None:
    """
    Return stock for an existing set of invoice items (used when invoice items
    are replaced during an edit).

    For each item, credit stock back to the warehouse that was originally used
    for that line item (stored in PrintableInvoiceItem.warehouse). If for some
    reason that warehouse is missing, fall back to the warehouse that appears
    in the stock movement record with the matching note. As a last resort,
    credit to the warehouse with the most stock of that product.
    """
    from django.db import transaction

    note = f"Invoice {invoice_number}"

    for item in items_qs:
        product = item.product
        quantity = item.quantity
        original_warehouse = item.warehouse

        if product is None or quantity <= Decimal("0.00"):
            continue

        # If the invoice item already has a warehouse, use that
        if original_warehouse:
            warehouse = original_warehouse
        else:
            # Fallback: find the OUT movement we originally created for this invoice+product
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
                # Last resort: credit to warehouse with most current stock
                stock_item = (
                    StockItem.objects.filter(product=product, warehouse__is_active=True)
                    .order_by("-quantity")
                    .first()
                )
                if stock_item is None:
                    continue
                warehouse = stock_item.warehouse

        with transaction.atomic():
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