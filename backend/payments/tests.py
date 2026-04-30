from datetime import date
from decimal import Decimal
from io import BytesIO

import openpyxl
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

    def test_cash_payment_response_does_not_include_cheque_fields(self):
        payment = Payment.objects.create(
            bill=self.bill,
            dra_username=self.dra.username,
            payment_method="cash",
            amount=Decimal("100.00"),
            transaction_number="",
            cheque_number="",
            cheque_date=None,
            cheque_type="",
            cheque_status="",
            firm="NA",
        )

        self.authenticate_admin()
        response = self.client.get(reverse("payments-all"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        result = next(item for item in response.data["results"] if item["id"] == payment.id)
        self.assertNotIn("cheque_number", result)
        self.assertNotIn("cheque_date", result)
        self.assertNotIn("cheque_type", result)
        self.assertNotIn("cheque_status", result)

    def test_upi_payment_response_does_not_include_cheque_fields(self):
        payment = Payment.objects.create(
            bill=self.bill,
            dra_username=self.dra.username,
            payment_method="upi",
            amount=Decimal("150.00"),
            transaction_number="UPI-123",
            cheque_number="",
            cheque_date=None,
            cheque_type="",
            cheque_status="",
            firm="NA",
        )

        self.authenticate_admin()
        response = self.client.get(reverse("payments-all"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        result = next(item for item in response.data["results"] if item["id"] == payment.id)
        self.assertNotIn("cheque_number", result)
        self.assertNotIn("cheque_date", result)
        self.assertNotIn("cheque_type", result)
        self.assertNotIn("cheque_status", result)

    def test_cheque_payment_response_includes_cheque_fields(self):
        payment = Payment.objects.create(
            bill=self.bill,
            dra_username=self.dra.username,
            payment_method="cheque",
            amount=Decimal("250.00"),
            cheque_number="CHQ777",
            cheque_date=date.today(),
            cheque_type="rtgs",
            cheque_status="pending",
            firm="NA",
        )

        self.authenticate_admin()
        response = self.client.get(reverse("payments-all"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        result = next(item for item in response.data["results"] if item["id"] == payment.id)
        self.assertEqual(result["cheque_number"], "CHQ777")
        self.assertIn("cheque_date", result)
        self.assertEqual(result["cheque_type"], "rtgs")
        self.assertEqual(result["cheque_status"], "pending")

    def test_export_omits_cheque_columns_for_cash_only_dataset(self):
        Payment.objects.create(
            bill=self.bill,
            dra_username=self.dra.username,
            payment_method="cash",
            amount=Decimal("120.00"),
            transaction_number="",
            cheque_number="",
            cheque_date=None,
            cheque_type="",
            cheque_status="",
            firm="NA",
        )

        self.authenticate_admin()
        response = self.client.get(reverse("payments-export"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        workbook = openpyxl.load_workbook(BytesIO(response.content))
        sheet = workbook["Payments"]
        headers = [cell.value for cell in sheet[1]]

        self.assertNotIn("Cheque Number", headers)
        self.assertNotIn("Cheque Date", headers)
        self.assertNotIn("Cheque Type", headers)
        self.assertNotIn("Cheque Status", headers)

    def test_export_includes_cheque_columns_when_cheque_payment_exists(self):
        Payment.objects.create(
            bill=self.bill,
            dra_username=self.dra.username,
            payment_method="cheque",
            amount=Decimal("220.00"),
            cheque_number="CHQ333",
            cheque_date=date.today(),
            cheque_type="neft",
            cheque_status="pending",
            firm="NA",
        )

        self.authenticate_admin()
        response = self.client.get(reverse("payments-export"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        workbook = openpyxl.load_workbook(BytesIO(response.content))
        sheet = workbook["Payments"]
        headers = [cell.value for cell in sheet[1]]

        self.assertIn("Cheque Number", headers)
        self.assertIn("Cheque Date", headers)
        self.assertIn("Cheque Type", headers)
        self.assertIn("Cheque Status", headers)

    def test_payments_list_returns_validation_error_for_invalid_start_date(self):
        self.authenticate_admin()
        response = self.client.get(reverse("payments-all"), {"start_date": "2026-99-99"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("start_date", response.data)

    def test_payments_export_returns_validation_error_for_invalid_end_date(self):
        self.authenticate_admin()
        response = self.client.get(reverse("payments-export"), {"end_date": "bad-date"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("end_date", response.data)