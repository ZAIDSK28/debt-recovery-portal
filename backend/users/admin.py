from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from users.models import AdminOTP, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Portal", {"fields": ("full_name", "role")}),
    )
    list_display = ("id", "username", "full_name", "email", "role", "is_staff")
    list_filter = ("role", "is_staff", "is_superuser")
    search_fields = ("username", "full_name", "email")


@admin.register(AdminOTP)
class AdminOTPAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "code", "created_at", "expires_at", "used")
    list_filter = ("used",)
    search_fields = ("user__username", "user__email")