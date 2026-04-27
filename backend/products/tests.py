# products/tests.py

from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import AdminOTP, User


class ProductAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin1",
            password="Admin@123",
            full_name="Admin",
            email="admin@example.com",
            role="admin",
            is_staff=True,
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

    def test_admin_can_create_product(self):
        self.authenticate_admin()
        response = self.client.post(
            reverse("products-list-create"),
            {
                "product_code": "PRD-001",
                "category": "Beverages",
                "name": "Mango Juice",
                "price": "120.00",
                "default_quantity": "1.00",
                "tax_rate": "18.00",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["product_code"], "PRD-001")