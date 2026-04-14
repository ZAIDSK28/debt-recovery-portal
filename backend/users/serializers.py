from __future__ import annotations

from django.contrib.auth import authenticate
from rest_framework import serializers

from users.models import User


class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "email", "role", "is_admin"]

    def get_is_admin(self, obj: User) -> bool:
        return obj.is_admin


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs["username"]
        password = attrs["password"]
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError({"detail": "Invalid username or password."})
        attrs["user"] = user
        return attrs


class VerifyOTPSerializer(serializers.Serializer):
    username = serializers.CharField()
    otp = serializers.CharField(min_length=6, max_length=6)