from __future__ import annotations

import io
from decimal import Decimal

import pandas as pd
from django.http import HttpResponse
from django.utils import timezone

from bills.models import Bill, Outlet


COLUMN_ALIASES = {
    "Invoice Number": "invoice_number",
    "Invoice Date": "invoice_date",
    "Route Name": "route_name",
    "Outlet Name": "outlet_name",
    "Brand": "brand",
    "Total Amount": "actual_amount",
    "Remaining Amount": "remaining_amount",
    "Overdue Days": "overdue_days",
    "Status": "status",
    "Assigned To": "assigned_to",
    "Created At": "created_at",
    "Cleared At": "cleared_at",
}


def format_export_datetime(value):
    if value is None:
        return ""
    if timezone.is_aware(value):
        value = timezone.localtime(value)
    return value.strftime("%Y-%m-%d %H:%M:%S")


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # First map known exported headers to internal field names
    df = df.rename(columns=COLUMN_ALIASES)

    # Then normalize anything else to snake_case
    df.columns = (
        df.columns.astype(str)
        .str.strip()
        .str.lower()
        .str.replace(r"\s+", "_", regex=True)
    )

    return df


def build_bills_export_response(queryset) -> HttpResponse:
    rows = []
    for bill in queryset.select_related("outlet__route", "assigned_to"):
        rows.append(
            {
                "Invoice Number": bill.invoice_number,
                "Invoice Date": bill.invoice_date.strftime("%Y-%m-%d"),
                "Route Name": bill.outlet.route.name,
                "Outlet Name": bill.outlet.name,
                "Brand": bill.brand,
                "Total Amount": float(bill.actual_amount),
                "Remaining Amount": float(bill.remaining_amount),
                "Overdue Days": bill.overdue_days,
                "Status": bill.status,
                "Assigned To": bill.assigned_to.full_name if bill.assigned_to else "",
                "Created At": format_export_datetime(bill.created_at),
                "Cleared At": format_export_datetime(bill.cleared_at),
            }
        )

    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Bills")

    output.seek(0)
    response = HttpResponse(
        output.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="bills_export.xlsx"'
    return response


def import_bills_from_excel(file) -> dict:
    df = pd.read_excel(file)
    df = normalize_columns(df)

    required_columns = [
        "invoice_number",
        "invoice_date",
        "route_name",
        "outlet_name",
        "brand",
        "actual_amount",
    ]

    errors: list[dict] = []
    imported = 0
    seen_invoice_numbers: set[str] = set()

    for column in required_columns:
        if column not in df.columns:
            return {"imported": 0, "errors": [{"row": None, "message": f"Missing column: {column}"}]}

    for index, row in df.iterrows():
        row_number = index + 2
        try:
            invoice_number = str(row["invoice_number"]).strip()
            route_name = str(row["route_name"]).strip()
            outlet_name = str(row["outlet_name"]).strip()
            brand = str(row["brand"]).strip()

            if pd.isna(row["actual_amount"]):
                raise ValueError("actual_amount is required")
            actual_amount = Decimal(str(row["actual_amount"]))

            if pd.isna(row["invoice_date"]):
                raise ValueError("invoice_date is required")
            invoice_date = pd.to_datetime(row["invoice_date"]).date()

            if not invoice_number:
                raise ValueError("invoice_number is required")

            if invoice_number in seen_invoice_numbers:
                raise ValueError("duplicate invoice_number found in uploaded file")
            seen_invoice_numbers.add(invoice_number)

            if Bill.objects.filter(invoice_number=invoice_number).exists():
                raise ValueError("invoice_number already exists")

            if actual_amount <= Decimal("0.00"):
                raise ValueError("actual_amount must be greater than zero")

            outlet = (
                Outlet.objects.filter(name=outlet_name, route__name=route_name)
                .select_related("route")
                .first()
            )
            if not outlet:
                raise ValueError("Outlet not found for route")

            Bill.objects.create(
                invoice_number=invoice_number,
                invoice_date=invoice_date,
                outlet=outlet,
                brand=brand,
                actual_amount=actual_amount,
                remaining_amount=actual_amount,
            )
            imported += 1
        except Exception as exc:
            errors.append({"row": row_number, "message": str(exc)})

    return {"imported": imported, "errors": errors}