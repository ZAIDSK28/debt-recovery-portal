from django.urls import path

from users.views import LoginView, ResendOTPView, UserListView, VerifyOTPView

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("verify-otp/", VerifyOTPView.as_view(), name="auth-verify-otp"),
    path("resend-otp/", ResendOTPView.as_view(), name="auth-resend-otp"),
    path("users/", UserListView.as_view(), name="users-list"),
]