// src/hooks/useProducts.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createProductApi,
  createProductCategoryApi,
  createStockMovementApi,
  createStockTransferApi,
  createWarehouseApi,
  deleteProductApi,
  deleteProductCategoryApi,
  deleteWarehouseApi,
  getProductByIdApi,
  getProductCategoriesApi,
  getProductsApi,
  getStockItemsApi,
  getStockMovementByIdApi,
  getStockMovementsApi,
  getStockTransfersApi,
  getLowStockItemsApi,
  getWarehousesApi,
  updateProductApi,
  updateProductCategoryApi,
  updateWarehouseApi,
  type CreateProductCategoryPayload,
  type CreateProductPayload,
  type CreateStockMovementPayload,
  type CreateStockTransferPayload,
  type CreateWarehousePayload,
  type ProductsQueryParams,
  type StockItemsQueryParams,
  type StockMovementsQueryParams,
  type StockTransfersQueryParams,
  type UpdateProductCategoryPayload,
  type UpdateProductPayload,
  type UpdateWarehousePayload,
} from "@/api/products.api";
import { queryKeys } from "@/hooks/queryKeys";

// ─── Products ─────────────────────────────────────────────────────────────────

export function useProducts(params?: ProductsQueryParams) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => getProductsApi(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useProduct(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.productDetail(id),
    queryFn: () => getProductByIdApi(id),
    enabled,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProductApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProductPayload }) =>
      updateProductApi(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.productDetail(variables.id) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProductApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Product Categories ───────────────────────────────────────────────────────

export function useProductCategories(params?: { is_active?: boolean; search?: string }) {
  return useQuery({
    queryKey: ["product-categories", params] as const,
    queryFn: () => getProductCategoriesApi(params),
  });
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductCategoryPayload) => createProductCategoryApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProductCategoryPayload }) =>
      updateProductCategoryApi(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      // Invalidate products too — category name/active state may be displayed there
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProductCategoryApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Warehouses ───────────────────────────────────────────────────────────────

export function useWarehouses(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: ["warehouses", params] as const,
    queryFn: () => getWarehousesApi(params),
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWarehousePayload) => createWarehouseApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateWarehousePayload }) =>
      updateWarehouseApi(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      // Invalidate stock data — warehouse name is denormalised in StockItem/StockMovement
      void queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      void queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      void queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteWarehouseApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

// ─── Stock Items ──────────────────────────────────────────────────────────────

export function useStockItems(params?: StockItemsQueryParams) {
  return useQuery({
    queryKey: queryKeys.stockItems(params),
    queryFn: () => getStockItemsApi(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useLowStockItems() {
  return useQuery({
    queryKey: queryKeys.lowStockItems,
    queryFn: getLowStockItemsApi,
    // Low-stock data is displayed as an alert widget — keep it fresh
    staleTime: 60_000,
  });
}

// ─── Stock Movements ──────────────────────────────────────────────────────────

export function useStockMovements(params?: StockMovementsQueryParams) {
  return useQuery({
    queryKey: queryKeys.stockMovements(params),
    queryFn: () => getStockMovementsApi(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useStockMovement(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.stockMovementDetail(id),
    queryFn: () => getStockMovementByIdApi(id),
    enabled,
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStockMovementPayload) => createStockMovementApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      void queryClient.invalidateQueries({ queryKey: ["stock-items"] });
    },
  });
}

// ─── Stock Transfers ──────────────────────────────────────────────────────────

export function useStockTransfers(params?: StockTransfersQueryParams) {
  return useQuery({
    queryKey: queryKeys.stockTransfers(params),
    queryFn: () => getStockTransfersApi(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateStockTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStockTransferPayload) => createStockTransferApi(payload),
    onSuccess: () => {
      // A transfer creates two StockMovements and updates two StockItems —
      // invalidate everything stock-related so all tabs reflect the new state
      void queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
      void queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      void queryClient.invalidateQueries({ queryKey: ["stock-items"] });
    },
  });
}