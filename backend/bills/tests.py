from datetime import date
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bills.models import Bill, Outlet, Route
from users.models import AdminOTP, User


class BillAccessTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin1",
            password="Admin@123",
            full_name="Admin",
            email="admin@example.com",
            role="admin",
            is_staff=True,
        )
        self.dra = User.objects.create_user(
            username="dra1",
            password="Dra@123",
            full_name="Dra",
            email="dra1@example.com",
            role="dra",
        )
        self.other_dra = User.objects.create_user(
            username="dra2",
            password="Dra@123",
            full_name="Dra Two",
            email="dra2@example.com",
            role="dra",
        )
        self.route = Route.objects.create(name="West")
        self.outlet = Outlet.objects.create(name="Outlet W", route=self.route)

        self.bill = Bill.objects.create(
            invoice_number="INV-2001",
            invoice_date=date.today(),
            outlet=self.outlet,
            brand="BrandY",
            actual_amount=Decimal("500.00"),
            remaining_amount=Decimal("500.00"),
            assigned_to=self.dra,
        )

    def authenticate_dra(self):
        response = self.client.post(
            reverse("auth-login"),
            {"username": "dra1", "password": "Dra@123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')

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

    def test_dra_only_sees_assigned_open_bills(self):
        self.authenticate_dra()
        response = self.client.get("/api/my-assignments-flat/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_dra_cannot_create_bill(self):
        self.authenticate_dra()
        response = self.client.post(
            reverse("bills-list-create"),
            {
                "invoice_number": "INV-9999",
                "invoice_date": str(date.today()),
                "outlet": self.outlet.id,
                "brand": "BrandZ",
                "actual_amount": "100.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_assign_bill(self):
        self.authenticate_admin()
        response = self.client.post(
            reverse("bills-assign"),
            {"bill_ids": [self.bill.id], "assigned_to": self.other_dra.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.bill.refresh_from_db()
        self.assertEqual(self.bill.assigned_to_id, self.other_dra.id)