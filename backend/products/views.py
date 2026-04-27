# products/views.py

from rest_framework import generics
from rest_framework.filters import SearchFilter

from core.permissions import IsAdmin
from products.models import Product
from products.serializers import ProductSerializer


class ProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
    search_fields = ["product_code", "name", "category"]
    filter_backends = [SearchFilter]
    ordering_fields = ["id", "product_code", "name", "category", "price", "tax_rate", "created_at"]


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ProductSerializer
    queryset = Product.objects.all()