# bills/management/commands/update_overdue_days.py

from django.core.management.base import BaseCommand

from bills.models import Bill
from core.utils import calculate_overdue_days


class Command(BaseCommand):
    help = "Recalculate overdue_days for all open bills"

    def handle(self, *args, **opts):
        updated = 0
        qs = Bill.objects.filter(status=Bill.Status.OPEN)

        for bill in qs.iterator():
            overdue_days = calculate_overdue_days(bill.invoice_date)
            if bill.overdue_days != overdue_days:
                bill.overdue_days = overdue_days
                bill.save(update_fields=["overdue_days"])
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Updated overdue days for {updated} open bills.")
        )