# products/urls.py

from django.urls import path

from products.views import (
    LowStockItemListView,
    ProductCategoryListCreateView,
    ProductCategoryRetrieveUpdateDestroyView,
    ProductListCreateView,
    ProductRetrieveUpdateDestroyView,
    StockItemListView,
    StockMovementListCreateView,
    StockMovementRetrieveView,
    StockTransferListCreateView,
    WarehouseListCreateView,
    WarehouseRetrieveUpdateDestroyView,
)

urlpatterns = [
    path("categories/", ProductCategoryListCreateView.as_view(), name="product-categories-list-create"),
    path("categories/<int:pk>/", ProductCategoryRetrieveUpdateDestroyView.as_view(), name="product-categories-detail"),
    path("", ProductListCreateView.as_view(), name="products-list-create"),
    path("<int:pk>/", ProductRetrieveUpdateDestroyView.as_view(), name="products-detail"),
    path("warehouses/", WarehouseListCreateView.as_view(), name="warehouses-list-create"),
    path("warehouses/<int:pk>/", WarehouseRetrieveUpdateDestroyView.as_view(), name="warehouses-detail"),
    # low-stock must be registered before stock-items/<pk>/ to avoid "low-stock"
    # being captured as an integer pk
    path("stock-items/low-stock/", LowStockItemListView.as_view(), name="stock-items-low-stock"),
    path("stock-items/", StockItemListView.as_view(), name="stock-items-list"),
    path("stock-movements/", StockMovementListCreateView.as_view(), name="stock-movements-list-create"),
    path("stock-movements/<int:pk>/", StockMovementRetrieveView.as_view(), name="stock-movements-detail"),
    path("stock-transfers/", StockTransferListCreateView.as_view(), name="stock-transfers-list-create"),
]
