# products/urls.py

from django.urls import path

from products.views import ProductListCreateView, ProductRetrieveUpdateDestroyView

urlpatterns = [
    path("", ProductListCreateView.as_view(), name="products-list-create"),
    path("<int:pk>/", ProductRetrieveUpdateDestroyView.as_view(), name="products-detail"),
]