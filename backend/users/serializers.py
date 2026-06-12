from __future__ import annotations

from django.contrib.auth import authenticate
from rest_framework import serializers

from users.models import User


# BUG FIX: Added `is_active` to UserSerializer fields.
# Previously UserSerializer (used in login/verify-otp responses) omitted is_active,
# while UserAdminSerializer (used in the user list) included it.
# This divergence meant the User object stored in localStorage post-login
# permanently lacked is_active, making any gate on user.is_active undefined.
# Both serializers now return the same User shape.
class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "email", "role", "is_active", "is_admin"]

    def get_is_admin(self, obj: User) -> bool:
        return obj.is_admin


class UserAdminSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "email", "role", "is_active", "is_admin"]

    def get_is_admin(self, obj: User) -> bool:
        return obj.is_admin


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "password", "full_name", "email", "role", "is_active"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        if user.role == User.Role.ADMIN:
            user.is_staff = True
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "email", "role", "is_active"]

    def update(self, instance, validated_data):
        old_role = instance.role
        user = super().update(instance, validated_data)
        if old_role != user.role:
            user.is_staff = user.role == User.Role.ADMIN
            user.save(update_fields=["is_staff"])
        return user


class UserSetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, min_length=8)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs["username"]
        password = attrs["password"]

        try:
            user_obj = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError({"detail": "Invalid username or password."})

        if not user_obj.is_active:
            raise serializers.ValidationError({"detail": "User account is inactive."})

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError({"detail": "Invalid username or password."})

        attrs["user"] = user
        return attrs


class VerifyOTPSerializer(serializers.Serializer):
    username = serializers.CharField()
    otp = serializers.CharField(min_length=6, max_length=6)