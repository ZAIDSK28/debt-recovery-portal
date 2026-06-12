from __future__ import annotations

import logging
import random

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import AdminOTP, User

logger = logging.getLogger(__name__)


def generate_otp_code() -> str:
    return f"{random.randint(0, 999999):06d}"


def issue_tokens_for_user(user: User) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def create_and_send_admin_otp(user: User) -> AdminOTP:
    with transaction.atomic():
        AdminOTP.objects.filter(user=user, used=False).update(used=True)

        otp = AdminOTP.objects.create(
            user=user,
            code=generate_otp_code(),
            expires_at=AdminOTP.expiry_time(),
        )

    subject = "Your Debt Recovery Portal OTP"
    message = f"Your OTP is {otp.code}. It expires in {settings.OTP_EXPIRY_MINUTES} minutes."

    if user.email:
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
        except Exception:
            logger.exception("Failed to send OTP email for admin user_id=%s", user.id)
            raise serializers.ValidationError({"detail": "Unable to send OTP at the moment. Please try again."})

    logger.info("OTP generated for admin user_id=%s", user.id)
    return otp