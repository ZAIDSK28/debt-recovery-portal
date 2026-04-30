from django.urls import path

from dashboard.views import DashboardSummaryView, DailyCollectionsView, RebuildDailyCollectionsView

urlpatterns = [
    path("summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("daily-collections/", DailyCollectionsView.as_view(), name="dashboard-daily-collections"),
    path("rebuild-daily-collections/", RebuildDailyCollectionsView.as_view(), name="dashboard-rebuild-daily-collections"),
]