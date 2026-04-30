from django.urls import path

from users.views import (
    LoginView,
    ResendOTPView,
    UserActivateView,
    UserDeactivateView,
    UserListView,
    UserRetrieveUpdateView,
    UserSetPasswordView,
    VerifyOTPView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("verify-otp/", VerifyOTPView.as_view(), name="auth-verify-otp"),
    path("resend-otp/", ResendOTPView.as_view(), name="auth-resend-otp"),
    path("users/", UserListView.as_view(), name="users-list"),
    path("users/<int:pk>/", UserRetrieveUpdateView.as_view(), name="users-detail"),
    path("users/<int:pk>/set-password/", UserSetPasswordView.as_view(), name="users-set-password"),
    path("users/<int:pk>/activate/", UserActivateView.as_view(), name="users-activate"),
    path("users/<int:pk>/deactivate/", UserDeactivateView.as_view(), name="users-deactivate"),
]