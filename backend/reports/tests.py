# reports/tests.py

from datetime import date
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bills.models import Bill, Outlet, Route
from products.models import Product
from reports.models import PrintableInvoice
from users.models import AdminOTP, User


class PrintableInvoiceIntegrationTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin1",
            password="Admin@123",
            full_name="Admin",
            email="admin@example.com",
            role="admin",
            is_staff=True,
        )

        self.route = Route.objects.create(name="North")
        self.outlet = Outlet.objects.create(name="Outlet One", route=self.route)
        self.existing_bill = Bill.objects.create(
            invoice_number="INV-EXISTING",
            invoice_date=date(2026, 4, 1),
            outlet=self.outlet,
            brand="BrandX",
            actual_amount=Decimal("100.00"),
            remaining_amount=Decimal("100.00"),
        )
        self.product1 = Product.objects.create(
            product_code="PRD-001",
            category="Beverages",
            name="Mango Juice",
            price=Decimal("100.00"),
            default_quantity=Decimal("1.00"),
            tax_rate=Decimal("18.00"),
            is_active=True,
        )
        self.product2 = Product.objects.create(
            product_code="PRD-002",
            category="Snacks",
            name="Chips",
            price=Decimal("50.00"),
            default_quantity=Decimal("1.00"),
            tax_rate=Decimal("5.00"),
            is_active=True,
        )

    def authenticate_admin(self):
        self.client.post(
            reverse("auth-login"),
            {"username": "admin1", "password": "Admin@123"},
            format="json",
        )
        otp = AdminOTP.objects.filter(user=self.admin).first()
        response = self.client.post(
            reverse("auth-verify-otp"),
            {"username": "admin1", "otp": otp.code},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')

    def test_invoice_totals_are_computed_from_products(self):
        self.authenticate_admin()

        response = self.client.post(
            reverse("printable-invoice-list-create"),
            {
                "invoice_number": "INV-PROD-001",
                "invoice_date": "2026-04-10",
                "customer_name": "Customer A",
                "route_name": "West",
                "outlet_name": "Outlet W",
                "brand": "BrandY",
                "discount_amount": "10.00",
                "creation_mode": "printable_and_bill",
                "items": [
                    {"product_id": self.product1.id, "quantity": "2.00"},
                    {"product_id": self.product2.id, "quantity": "1.00"},
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["subtotal"], "250.00")
        self.assertEqual(response.data["tax_amount"], "38.50")
        self.assertEqual(response.data["discount_amount"], "10.00")
        self.assertEqual(response.data["total_amount"], "278.50")
        self.assertEqual(len(response.data["items"]), 2)

    def test_creation_rejects_invoice_number_collision_with_bill(self):
        self.authenticate_admin()

        response = self.client.post(
            reverse("printable-invoice-list-create"),
            {
                "invoice_number": "INV-EXISTING",
                "invoice_date": "2026-04-10",
                "customer_name": "Customer C",
                "route_name": "West",
                "outlet_name": "Outlet C",
                "brand": "BrandY",
                "discount_amount": "0.00",
                "creation_mode": "printable_and_bill",
                "items": [
                    {"product_id": self.product1.id, "quantity": "1.00"},
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("invoice_number", response.data)