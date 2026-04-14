import logging

from django.core.management.base import BaseCommand

from bills.models import Bill
from core.utils import calculate_overdue_days

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Update overdue days for all open bills"

    def handle(self, *args, **options):
        updated = 0
        bills = Bill.objects.filter(status=Bill.Status.OPEN)
        for bill in bills.iterator():
            overdue_days = calculate_overdue_days(bill.invoice_date)
            if bill.overdue_days != overdue_days:
                bill.overdue_days = overdue_days
                bill.save(update_fields=["overdue_days"])
                updated += 1

        logger.info("Updated overdue days for %s bills", updated)
        self.stdout.write(self.style.SUCCESS(f"Updated overdue days for {updated} bills"))