# bills/utils.py

from __future__ import annotations

import io
import logging
from decimal import Decimal, InvalidOperation

import pandas as pd
from django.db import IntegrityError, transaction
from django.http import HttpResponse
from django.utils import timezone

from bills.models import Bill, BillImportJob, Outlet, Route
from users.models import User

logger = logging.getLogger(__name__)

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
    df = df.rename(columns=COLUMN_ALIASES)
    df.columns = (
        df.columns.astype(str)
        .str.strip()
        .str.lower()
        .str.replace(r"\s+", "_", regex=True)
    )
    return df


def _clean_cell_value(value) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def _safe_error_message(exc: Exception) -> str:
    message = str(exc).strip()
    return message or "Invalid row data."


def _resolve_assigned_user(assigned_to_value: str) -> User | None:
    if not assigned_to_value:
        return None

    user = User.objects.filter(full_name=assigned_to_value).first()
    if user:
        return user

    user = User.objects.filter(username=assigned_to_value).first()
    if user:
        return user

    user = User.objects.filter(email=assigned_to_value).first()
    if user:
        return user

    return None


def _parse_actual_amount(value) -> Decimal:
    if pd.isna(value):
        raise ValueError("actual_amount is required")

    try:
        amount = Decimal(str(value).strip())
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("actual_amount must be a valid decimal number")

    if amount <= Decimal("0.00"):
        raise ValueError("actual_amount must be greater than zero")

    return amount


def _parse_invoice_date(value):
    if pd.isna(value):
        raise ValueError("invoice_date is required")

    try:
        parsed = pd.to_datetime(value, errors="raise")
    except Exception:
        raise ValueError("invoice_date must be a valid date")

    if pd.isna(parsed):
        raise ValueError("invoice_date must be a valid date")

    return parsed.date()


def _validate_required_text(value: str, field_name: str) -> str:
    if not value:
        raise ValueError(f"{field_name} is required")
    return value


def _update_job(job: BillImportJob, **fields) -> None:
    for key, value in fields.items():
        setattr(job, key, value)
    job.save(update_fields=list(fields.keys()))


def _build_bills_export_filename(start_date: str | None = None, end_date: str | None = None) -> str:
    if start_date and end_date:
        return f"bills_{start_date}_to_{end_date}.xlsx"
    if start_date:
        return f"bills_from_{start_date}.xlsx"
    if end_date:
        return f"bills_until_{end_date}.xlsx"
    return "bills_export.xlsx"


def build_bills_export_response(queryset, start_date: str | None = None, end_date: str | None = None) -> HttpResponse:
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
    filename = _build_bills_export_filename(start_date=start_date, end_date=end_date)
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def import_bills_from_excel(file, job: BillImportJob | None = None) -> dict:
    try:
        df = pd.read_excel(file)
    except Exception:
        logger.exception("Failed to read bills import file")
        result = {"imported": 0, "errors": [{"row": None, "message": "Unable to read the uploaded Excel file."}]}
        if job:
            _update_job(
                job,
                status=BillImportJob.Status.FAILED,
                total_rows=0,
                processed_rows=0,
                imported=0,
                errors=result["errors"],
                error_count=len(result["errors"]),
                completed_at=timezone.now(),
            )
        return result

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
            result = {"imported": 0, "errors": [{"row": None, "message": f"Missing column: {column}"}]}
            if job:
                _update_job(
                    job,
                    status=BillImportJob.Status.FAILED,
                    total_rows=0,
                    processed_rows=0,
                    imported=0,
                    errors=result["errors"],
                    error_count=len(result["errors"]),
                    completed_at=timezone.now(),
                )
            return result

    if job:
        _update_job(
            job,
            status=BillImportJob.Status.PROCESSING,
            total_rows=len(df.index),
            processed_rows=0,
            imported=0,
            errors=[],
            error_count=0,
        )

    for index, row in df.iterrows():
        row_number = index + 2
        try:
            invoice_number = _validate_required_text(_clean_cell_value(row["invoice_number"]), "invoice_number")
            route_name = _validate_required_text(_clean_cell_value(row["route_name"]), "route_name")
            outlet_name = _validate_required_text(_clean_cell_value(row["outlet_name"]), "outlet_name")
            brand = _validate_required_text(_clean_cell_value(row["brand"]), "brand")
            assigned_to_value = _clean_cell_value(row["assigned_to"]) if "assigned_to" in df.columns else ""

            actual_amount = _parse_actual_amount(row["actual_amount"])
            invoice_date = _parse_invoice_date(row["invoice_date"])

            if invoice_number in seen_invoice_numbers:
                raise ValueError("duplicate invoice_number found in uploaded file")
            seen_invoice_numbers.add(invoice_number)

            if Bill.objects.filter(invoice_number=invoice_number).exists():
                raise ValueError("invoice_number already exists")

            with transaction.atomic():
                route, _ = Route.objects.get_or_create(name=route_name)
                outlet, _ = Outlet.objects.get_or_create(name=outlet_name, route=route)
                assigned_user = _resolve_assigned_user(assigned_to_value)

                Bill.objects.create(
                    invoice_number=invoice_number,
                    invoice_date=invoice_date,
                    outlet=outlet,
                    brand=brand,
                    actual_amount=actual_amount,
                    remaining_amount=actual_amount,
                    assigned_to=assigned_user,
                )
            imported += 1
        except IntegrityError:
            message = "invoice_number already exists"
            logger.warning(
                "Bill import row integrity failure",
                extra={"row_number": row_number, "message": message},
            )
            errors.append({"row": row_number, "message": message})
        except Exception as exc:
            message = _safe_error_message(exc)
            logger.warning(
                "Bill import row failed",
                extra={"row_number": row_number, "message": message},
            )
            errors.append({"row": row_number, "message": message})
        finally:
            if job:
                _update_job(
                    job,
                    processed_rows=job.processed_rows + 1,
                    imported=imported,
                    errors=errors,
                    error_count=len(errors),
                )

    result = {"imported": imported, "errors": errors}

    if job:
        _update_job(
            job,
            status=BillImportJob.Status.COMPLETED,
            completed_at=timezone.now(),
            imported=imported,
            errors=errors,
            error_count=len(errors),
            processed_rows=job.total_rows,
        )

    return result