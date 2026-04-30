from django.core.management.base import BaseCommand

from dashboard.services import rebuild_daily_metrics


class Command(BaseCommand):
    help = "Rebuild persisted daily collection metrics"

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=30)

    def handle(self, *args, **options):
        days = options["days"]
        metrics = rebuild_daily_metrics(days=days)
        self.stdout.write(self.style.SUCCESS(f"Rebuilt {len(metrics)} daily collection metric rows."))