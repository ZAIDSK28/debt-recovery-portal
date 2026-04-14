from datetime import date
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bills.models import Bill, Outlet, Route
from payments.models import Payment
from users.models import AdminOTP, User


class PaymentBusinessRulesTests(APITestCase):
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
            full_name="DRA One",
            email="dra1@example.com",
            role="dra",
        )

        self.route = Route.objects.create(name="North")
        self.outlet = Outlet.objects.create(name="Outlet One", route=self.route)
        self.bill = Bill.objects.create(
            invoice_number="INV-1001",
            invoice_date=date.today(),
            outlet=self.outlet,
            brand="BrandX",
            actual_amount=Decimal("1000.00"),
            remaining_amount=Decimal("1000.00"),
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

    def test_cash_payment_reduces_remaining_immediately(self):
        self.authenticate_dra()

        response = self.client.post(
            reverse("record-payment", kwargs={"bill_id": self.bill.id}),
            {
                "amount": "200.00",
                "payment_method": "cash",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.bill.refresh_from_db()
        self.assertEqual(self.bill.remaining_amount, Decimal("800.00"))
        self.assertEqual(self.bill.status, "open")

    def test_upi_payment_can_clear_bill_immediately(self):
        self.authenticate_dra()

        response = self.client.post(
            reverse("record-payment", kwargs={"bill_id": self.bill.id}),
            {
                "amount": "1000.00",
                "payment_method": "upi",
                "transaction_number": "UPI-123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.bill.refresh_from_db()
        self.assertEqual(self.bill.remaining_amount, Decimal("0.00"))
        self.assertEqual(self.bill.status, "cleared")
        self.assertIsNotNone(self.bill.cleared_at)

    def test_cheque_payment_pending_does_not_reduce_remaining(self):
        self.authenticate_dra()

        response = self.client.post(
            reverse("record-payment", kwargs={"bill_id": self.bill.id}),
            {
                "amount": "300.00",
                "payment_method": "cheque",
                "cheque_number": "CHQ001",
                "cheque_date": str(date.today()),
                "cheque_type": "rtgs",
                "firm": "NA",
                "cheque_status": "pending",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.bill.refresh_from_db()
        self.assertEqual(self.bill.remaining_amount, Decimal("1000.00"))
        self.assertEqual(self.bill.status, "open")

    def test_cheque_payment_cleared_reduces_remaining_after_admin_update(self):
        self.authenticate_dra()

        create_response = self.client.post(
            reverse("record-payment", kwargs={"bill_id": self.bill.id}),
            {
                "amount": "300.00",
                "payment_method": "cheque",
                "cheque_number": "CHQ001",
                "cheque_date": str(date.today()),
                "cheque_type": "rtgs",
                "firm": "NA",
                "cheque_status": "pending",
            },
            format="json",
        )
        payment_id = create_response.data["id"]

        self.bill.refresh_from_db()
        self.assertEqual(self.bill.remaining_amount, Decimal("1000.00"))

        self.client.credentials()
        self.authenticate_admin()

        update_response = self.client.patch(
            reverse("payments-update", kwargs={"pk": payment_id}),
            {"cheque_status": "cleared"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)

        self.bill.refresh_from_db()
        self.assertEqual(self.bill.remaining_amount, Decimal("700.00"))
        self.assertEqual(self.bill.status, "open")

    def test_bounced_cheque_does_not_reduce_remaining(self):
        payment = Payment.objects.create(
            bill=self.bill,
            dra_username=self.dra.username,
            payment_method="cheque",
            amount=Decimal("400.00"),
            cheque_number="CHQ002",
            cheque_date=date.today(),
            cheque_type="neft",
            cheque_status="pending",
            firm="NA",
        )

        self.authenticate_admin()
        response = self.client.patch(
            reverse("payments-update", kwargs={"pk": payment.id}),
            {"cheque_status": "bounced"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.bill.refresh_from_db()
        self.assertEqual(self.bill.remaining_amount, Decimal("1000.00"))
        self.assertEqual(self.bill.status, "open")

    def test_dra_cannot_access_admin_payment_list(self):
        self.authenticate_dra()
        response = self.client.get(reverse("payments-all"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)