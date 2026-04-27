# users/views.py

from __future__ import annotations

import logging

from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from core.permissions import IsAdmin
from core.throttling import LoginRateThrottle, OTPResendRateThrottle, OTPVerifyRateThrottle
from core.utils import create_audit_log
from users.auth_utils import create_and_send_admin_otp, issue_tokens_for_user
from users.models import AdminOTP, User
from users.serializers import LoginSerializer, UserSerializer, VerifyOTPSerializer

logger = logging.getLogger(__name__)


class LoginView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    throttle_classes = [LoginRateThrottle]

    @extend_schema(request=LoginSerializer)
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: User = serializer.validated_data["user"]

        if user.role == User.Role.ADMIN:
            create_and_send_admin_otp(user)
            create_audit_log(
                actor=user,
                action="auth.login.otp_requested",
                entity_type="user",
                entity_id=str(user.id),
                metadata={"username": user.username},
            )
            return Response({"requires_otp": True}, status=status.HTTP_200_OK)

        tokens = issue_tokens_for_user(user)
        create_audit_log(
            actor=user,
            action="auth.login.success",
            entity_type="user",
            entity_id=str(user.id),
            metadata={"username": user.username, "role": user.role},
        )
        return Response(
            {
                **tokens,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class VerifyOTPView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = VerifyOTPSerializer
    throttle_classes = [OTPVerifyRateThrottle]

    @extend_schema(request=VerifyOTPSerializer)
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"]
        otp_code = serializer.validated_data["otp"]

        try:
            user = User.objects.get(username=username, role=User.Role.ADMIN)
        except User.DoesNotExist:
            return Response({"detail": "Invalid user."}, status=status.HTTP_400_BAD_REQUEST)

        otp = (
            AdminOTP.objects.filter(user=user, code=otp_code, used=False, expires_at__gte=timezone.now())
            .order_by("-created_at")
            .first()
        )

        if not otp:
            return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

        otp.used = True
        otp.save(update_fields=["used"])

        tokens = issue_tokens_for_user(user)
        logger.info("Admin OTP verified user_id=%s", user.id)

        create_audit_log(
            actor=user,
            action="auth.otp.verified",
            entity_type="user",
            entity_id=str(user.id),
            metadata={"username": user.username},
        )

        return Response(
            {
                **tokens,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class ResendOTPView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [OTPResendRateThrottle]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username", "")
        try:
            user = User.objects.get(username=username, role=User.Role.ADMIN)
        except User.DoesNotExist:
            return Response({"detail": "Invalid user."}, status=status.HTTP_400_BAD_REQUEST)

        create_and_send_admin_otp(user)
        create_audit_log(
            actor=user,
            action="auth.otp.resent",
            entity_type="user",
            entity_id=str(user.id),
            metadata={"username": user.username},
        )
        return Response({"detail": "OTP sent."}, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all().order_by("full_name", "username")
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get("role")
        if role:
            queryset = queryset.filter(role=role)
        return queryset