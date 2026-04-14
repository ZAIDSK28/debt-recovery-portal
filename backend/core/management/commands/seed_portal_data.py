from datetime import date, timedelta
from decimal import Decimal
import random

from django.core.management.base import BaseCommand

from bills.models import Bill, Outlet, Route
from users.models import User


class Command(BaseCommand):
    help = "Seed sample data for Debt Recovery Portal"

    def handle(self, *args, **options):
        admin_user, _ = User.objects.get_or_create(
            username="admin1",
            defaults={
                "full_name": "Office Admin",
                "email": "admin@example.com",
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin_user.set_password("Admin@123")
        admin_user.save()

        dra_users = []
        for i in range(1, 4):
            dra, _ = User.objects.get_or_create(
                username=f"dra{i}",
                defaults={
                    "full_name": f"DRA Agent {i}",
                    "email": f"dra{i}@example.com",
                    "role": "dra",
                },
            )
            dra.set_password("Dra@123")
            dra.save()
            dra_users.append(dra)

        routes = []
        for route_name in ["North Route", "South Route", "Central Route"]:
            route, _ = Route.objects.get_or_create(name=route_name)
            routes.append(route)

        outlets = []
        for route in routes:
            for idx in range(1, 6):
                outlet, _ = Outlet.objects.get_or_create(
                    name=f"{route.name} Outlet {idx}",
                    route=route,
                )
                outlets.append(outlet)

        brands = ["BrandX", "BrandY", "BrandZ"]
        for idx in range(1, 31):
            outlet = random.choice(outlets)
            amount = Decimal(random.choice(["1500.00", "2400.00", "3000.00", "4800.00", "6500.00"]))
            bill, created = Bill.objects.get_or_create(
                invoice_number=f"INV-{1000 + idx}",
                defaults={
                    "invoice_date": date.today() - timedelta(days=random.randint(1, 90)),
                    "outlet": outlet,
                    "brand": random.choice(brands),
                    "actual_amount": amount,
                    "remaining_amount": amount,
                    "assigned_to": random.choice(dra_users),
                },
            )
            if created:
                bill.save()

        self.stdout.write(self.style.SUCCESS("Seed data created successfully."))