# reports/services.py

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction

from bills.models import Bill, Outlet, Route
from payments.services import reconcile_bill_from_payments
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
        [PrintableInvoiceItem(invoice=invoice, **item) for item in computed_items]
    )