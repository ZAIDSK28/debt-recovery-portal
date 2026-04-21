# reports/tests.py

from datetime import date
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bills.models import Bill, Outlet, Route
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

    def test_printable_and_bill_creation_links_bill(self):
        self.authenticate_admin()

        response = self.client.post(
            reverse("printable-invoice-list-create"),
            {
                "invoice_number": "INV-NEW-001",
                "invoice_date": "2026-04-10",
                "customer_name": "Customer A",
                "route_name": "West",
                "outlet_name": "Outlet W",
                "brand": "BrandY",
                "subtotal": "100.00",
                "tax_amount": "0.00",
                "discount_amount": "0.00",
                "total_amount": "100.00",
                "creation_mode": "printable_and_bill",
                "items": [
                    {
                        "description": "Item 1",
                        "quantity": "1.00",
                        "rate": "100.00",
                        "amount": "100.00",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data["linked_bill_id"])

        invoice = PrintableInvoice.objects.get(invoice_number="INV-NEW-001")
        self.assertIsNotNone(invoice.linked_bill)
        self.assertEqual(invoice.linked_bill.invoice_number, "INV-NEW-001")

    def test_dashboard_bill_delete_nulls_invoice_link(self):
        self.authenticate_admin()

        response = self.client.post(
            reverse("printable-invoice-list-create"),
            {
                "invoice_number": "INV-NEW-002",
                "invoice_date": "2026-04-10",
                "customer_name": "Customer B",
                "route_name": "West",
                "outlet_name": "Outlet Z",
                "brand": "BrandY",
                "subtotal": "100.00",
                "tax_amount": "0.00",
                "discount_amount": "0.00",
                "total_amount": "100.00",
                "creation_mode": "printable_and_bill",
                "items": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        linked_bill_id = response.data["linked_bill_id"]

        delete_response = self.client.delete(
            reverse("bills-detail", kwargs={"pk": linked_bill_id})
        )
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)

        invoice = PrintableInvoice.objects.get(invoice_number="INV-NEW-002")
        self.assertIsNone(invoice.linked_bill)

        detail_response = self.client.get(
            reverse("printable-invoice-detail", kwargs={"pk": invoice.id})
        )
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertIsNone(detail_response.data["linked_bill_id"])

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
                "subtotal": "100.00",
                "tax_amount": "0.00",
                "discount_amount": "0.00",
                "total_amount": "100.00",
                "creation_mode": "printable_and_bill",
                "items": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("invoice_number", response.data)