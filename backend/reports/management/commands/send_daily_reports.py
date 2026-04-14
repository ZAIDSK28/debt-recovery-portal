import datetime
import logging
from io import BytesIO

import pytz                                       # ← add this
import openpyxl
import pandas as pd
from django.conf import settings
from django.core.mail import EmailMessage
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models.functions import Coalesce
from django.db.models import Sum, Value, DecimalField

from bills.models import Bill
from payments.models import Payment

logger = logging.getLogger(__name__)

# ────────────────────────────────────────────────────────────────────────────────
# Make an explicit IST tzinfo to use below
IST = pytz.timezone("Asia/Kolkata")
# ────────────────────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = (
        "Compile today’s payments… [truncated for brevity] …and email an Excel file."
    )

    def handle(self, *args, **options):
        today = timezone.localdate()

        payments_qs = (
            Payment.objects
                   .filter(created_at__date=today)
                   .select_related('bill', 'dra')
                   .order_by('created_at')
        )
        if not payments_qs.exists():
            msg = f"No payments found for {today}; skipping email."
            self.stdout.write(self.style.WARNING(msg))
            logger.info(msg)
            return

        # ─── compute totals (unchanged) ────────────────────────────────────────────
        cash_total = Payment.objects.filter(
            payment_method='cash', created_at__date=today
        ).aggregate(
            total=Coalesce(
                Sum('amount'),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
            )
        )['total']
        upi_total = Payment.objects.filter(
            payment_method='upi', created_at__date=today
        ).aggregate(
            total=Coalesce(
                Sum('amount'),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
            )
        )['total']
        cheque_total = Payment.objects.filter(
            payment_method__in=['cheque', 'electronic'],
            cheque_status='cleared',
            cheque_date=today
        ).aggregate(
            total=Coalesce(
                Sum('amount'),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
            )
        )['total']

        # ─── build rows ─────────────────────────────────────────────────────────────
        rows = []
        for p in payments_qs:
            bill = p.bill
            if not bill:
                continue

            inv_date = bill.invoice_date
            if isinstance(inv_date, datetime.datetime):
                inv_date = inv_date.date()
            overdue = max((today - inv_date).days, 0) if inv_date else ''

            rows.append({
                "Bill ID":        bill.id,
                "Brand":          bill.brand,
                "Invoice Date":   inv_date,
                "Route Name":     bill.route.name,
                "Invoice Number": bill.invoice_number,
                "Outlet Name":    bill.outlet.name,
                "Payment Amount": p.amount,
                "Username":       p.dra.username if p.dra else '',
                "Overdue Days":   overdue,
                # ─── convert to IST before dropping tzinfo ───────────────────────────
                "Created At": p.created_at.astimezone(IST).strftime("%Y-%m-%d %I:%M:%S %p"),
            })

        df = pd.DataFrame(rows, columns=[
            "Bill ID","Brand","Invoice Date","Route Name",
            "Invoice Number","Outlet Name","Payment Amount",
            "Username","Overdue Days","Created At"
        ])

        # ─── write Excel ────────────────────────────────────────────────────────────
        out = BytesIO()
        with pd.ExcelWriter(out, engine='openpyxl') as writer:
            workbook = writer.book
            sheet = workbook.create_sheet("DailyPaymentsReport", 0)

            sheet.append([
                "Cash Total",   float(cash_total),
                "UPI Total",    float(upi_total),
                "Cheque Total", float(cheque_total),
            ])
            sheet.append([])

            for r in openpyxl.utils.dataframe.dataframe_to_rows(df, index=False, header=True):
                sheet.append(r)

            # auto‐width (unchanged)
            for idx, col in enumerate(df.columns, 1):
                max_len = max(len(str(col)), *(len(str(cell)) for cell in df[col].values)) + 2
                sheet.column_dimensions[openpyxl.utils.get_column_letter(idx)].width = max_len

        out.seek(0)

        # ─── email ──────────────────────────────────────────────────────────────────
        recipients = getattr(settings, "DAILY_REPORT_RECIPIENTS", [])
        if not recipients:
            err = "DAILY_REPORT_RECIPIENTS not set; cannot send report."
            self.stderr.write(self.style.ERROR(err))
            logger.error(err)
            return

        subject = f"Daily Payments Report: {today}"
        body = (
            f"Attached is the payments report for {today}, including "
            "per‐payment details (with Created At in IST) and today’s totals.\n"
        )
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipients,
        )
        filename = f"daily_payments_{today}.xlsx"
        email.attach(
            filename,
            out.read(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        try:
            email.send(fail_silently=False)
            ok = f"Sent daily report to {recipients}"
            self.stdout.write(self.style.SUCCESS(ok))
            logger.info(ok)
        except Exception as e:
            err = f"Failed to send report: {e}"
            self.stderr.write(self.style.ERROR(err))
            logger.exception(err)
