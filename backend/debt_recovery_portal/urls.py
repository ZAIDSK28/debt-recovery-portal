# debt_recovery_portal/urls.py

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView

from bills.views import MyAssignmentsFlatView, OutletListView, RouteListView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/", include("users.urls")),
    path("api/bills/", include("bills.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/routes/", RouteListView.as_view(), name="routes-list-root"),
    path("api/outlets/", OutletListView.as_view(), name="outlets-list-root"),
    path("api/my-assignments-flat/", MyAssignmentsFlatView.as_view(), name="my-assignments-flat-root"),
]