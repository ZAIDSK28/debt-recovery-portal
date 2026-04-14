from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        DRA = "dra", "DRA"

    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    role = models.CharField(max_length=20, choices=Role.choices)

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN

    def __str__(self) -> str:
        return self.username


class AdminOTP(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="otps")
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def is_valid(self) -> bool:
        return not self.used and timezone.now() <= self.expires_at

    @classmethod
    def expiry_time(cls):
        return timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)