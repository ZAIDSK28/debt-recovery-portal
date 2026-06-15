# products/views.py

from rest_framework import generics
from rest_framework.filters import SearchFilter

from core.permissions import IsAdmin
from products.models import Product, ProductCategory, StockItem, StockMovement, StockTransfer, Warehouse
from products.serializers import (
    ProductCategorySerializer,
    ProductSerializer,
    StockItemSerializer,
    StockMovementSerializer,
    StockTransferSerializer,
    WarehouseSerializer,
)


class ProductCategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ProductCategorySerializer
    search_fields = ["name", "description"]
    filter_backends = [SearchFilter]
    ordering_fields = ["id", "name", "created_at"]

    def get_queryset(self):
        queryset = ProductCategory.objects.all()
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")
        return queryset


class ProductCategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ProductCategorySerializer
    queryset = ProductCategory.objects.all()


class ProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ProductSerializer
    search_fields = ["product_code", "name", "category", "category_ref__name"]
    filter_backends = [SearchFilter]
    ordering_fields = ["id", "product_code", "name", "category", "price", "tax_rate", "created_at"]

    def get_queryset(self):
        queryset = Product.objects.select_related("category_ref").all()
        category_id = self.request.query_params.get("category_id")
        is_active = self.request.query_params.get("is_active")
        if category_id:
            queryset = queryset.filter(category_ref_id=category_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")
        return queryset


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ProductSerializer
    queryset = Product.objects.select_related("category_ref").all()


class WarehouseListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = WarehouseSerializer
    ordering_fields = ["id", "name", "created_at"]
    search_fields = ["name", "location"]

    def get_queryset(self):
        queryset = Warehouse.objects.all()
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")
        return queryset


class WarehouseRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = WarehouseSerializer
    queryset = Warehouse.objects.all()


class StockItemListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = StockItemSerializer
    ordering_fields = ["id", "quantity", "reorder_level", "updated_at", "product__name", "warehouse__name"]
    search_fields = ["product__name", "product__product_code", "warehouse__name"]

    def get_queryset(self):
        queryset = StockItem.objects.select_related(
            "product", "product__category_ref", "warehouse"
        ).all()
        warehouse_id = self.request.query_params.get("warehouse_id")
        product_id = self.request.query_params.get("product_id")
        low_stock_only = self.request.query_params.get("low_stock_only")
        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if low_stock_only and low_stock_only.lower() == "true":
            from django.db.models import F
            queryset = queryset.filter(quantity__lte=F("reorder_level"))
        return queryset


class LowStockItemListView(generics.ListAPIView):
    """Read-only view returning only StockItems where quantity ≤ reorder_level."""

    permission_classes = [IsAdmin]
    serializer_class = StockItemSerializer
    ordering_fields = ["quantity", "reorder_level", "product__name", "warehouse__name"]
    search_fields = ["product__name", "product__product_code", "warehouse__name"]

    def get_queryset(self):
        from django.db.models import F
        return (
            StockItem.objects.select_related(
                "product", "product__category_ref", "warehouse"
            )
            .filter(quantity__lte=F("reorder_level"))
        )


class StockMovementListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = StockMovementSerializer
    ordering_fields = ["id", "created_at", "quantity"]
    search_fields = ["product__name", "warehouse__name", "note"]

    def get_queryset(self):
        queryset = StockMovement.objects.select_related("product", "warehouse").all()
        movement_type = self.request.query_params.get("movement_type")
        warehouse_id = self.request.query_params.get("warehouse_id")
        product_id = self.request.query_params.get("product_id")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)
        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        return queryset


class StockMovementRetrieveView(generics.RetrieveAPIView):
    permission_classes = [IsAdmin]
    serializer_class = StockMovementSerializer
    queryset = StockMovement.objects.select_related("product", "warehouse").all()


class StockTransferListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = StockTransferSerializer
    ordering_fields = ["id", "created_at", "quantity"]
    search_fields = [
        "product__name",
        "product__product_code",
        "source_warehouse__name",
        "destination_warehouse__name",
        "note",
    ]

    def get_queryset(self):
        queryset = StockTransfer.objects.select_related(
            "source_warehouse",
            "destination_warehouse",
            "product",
            "product__category_ref",
            "created_by",
        ).all()
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)