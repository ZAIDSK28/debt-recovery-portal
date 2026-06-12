// src/api/products.api.ts

import { axiosInstance } from "@/api/axiosInstance";
import type {
  PaginatedResponse,
  Product,
  ProductCategory,
  StockItem,
  StockMovement,
  StockTransfer,
  StockMovementType,
  Warehouse,
} from "@/types";

// ─── Query param shapes ───────────────────────────────────────────────────────

export interface ProductsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  category_id?: number;
  is_active?: boolean;
}

export interface StockItemsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  warehouse_id?: number;
  product_id?: number;
  low_stock_only?: boolean;
}

export interface StockMovementsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  movement_type?: StockMovementType;
  warehouse_id?: number;
  product_id?: number;
}

export interface StockTransfersQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

// ─── Write payload shapes ─────────────────────────────────────────────────────

export interface CreateProductPayload {
  // product_code is intentionally omitted — the backend auto-generates it
  category?: string;
  category_id?: number | null;
  name: string;
  price: string;
  default_quantity: string;
  tax_rate: string;
  is_active: boolean;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface CreateProductCategoryPayload {
  name: string;
  description?: string;
  is_active?: boolean;
}

export type UpdateProductCategoryPayload = Partial<CreateProductCategoryPayload>;

export interface CreateWarehousePayload {
  name: string;
  location?: string;
  is_active?: boolean;
}

export type UpdateWarehousePayload = Partial<CreateWarehousePayload>;

export interface CreateStockMovementPayload {
  product: number;
  warehouse: number;
  movement_type: StockMovementType;
  quantity: string;
  note?: string;
}

export interface CreateStockTransferPayload {
  source_warehouse: number;
  destination_warehouse: number;
  product: number;
  quantity: string;
  note?: string;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProductsApi(
  params?: ProductsQueryParams,
): Promise<PaginatedResponse<Product>> {
  const { data } = await axiosInstance.get<PaginatedResponse<Product>>("/products/", { params });
  return data;
}

export async function getProductByIdApi(id: number): Promise<Product> {
  const { data } = await axiosInstance.get<Product>(`/products/${id}/`);
  return data;
}

export async function createProductApi(payload: CreateProductPayload): Promise<Product> {
  const { data } = await axiosInstance.post<Product>("/products/", payload);
  return data;
}

export async function updateProductApi(id: number, payload: UpdateProductPayload): Promise<Product> {
  const { data } = await axiosInstance.patch<Product>(`/products/${id}/`, payload);
  return data;
}

export async function deleteProductApi(id: number): Promise<void> {
  await axiosInstance.delete(`/products/${id}/`);
}

// ─── Product Categories ───────────────────────────────────────────────────────

export async function getProductCategoriesApi(params?: {
  is_active?: boolean;
  search?: string;
}): Promise<ProductCategory[]> {
  const { data } = await axiosInstance.get<ProductCategory[] | PaginatedResponse<ProductCategory>>(
    "/products/categories/",
    { params },
  );
  return Array.isArray(data) ? data : data.results;
}

export async function getProductCategoryByIdApi(id: number): Promise<ProductCategory> {
  const { data } = await axiosInstance.get<ProductCategory>(`/products/categories/${id}/`);
  return data;
}

export async function createProductCategoryApi(
  payload: CreateProductCategoryPayload,
): Promise<ProductCategory> {
  const { data } = await axiosInstance.post<ProductCategory>("/products/categories/", payload);
  return data;
}

export async function updateProductCategoryApi(
  id: number,
  payload: UpdateProductCategoryPayload,
): Promise<ProductCategory> {
  const { data } = await axiosInstance.patch<ProductCategory>(
    `/products/categories/${id}/`,
    payload,
  );
  return data;
}

export async function deleteProductCategoryApi(id: number): Promise<void> {
  await axiosInstance.delete(`/products/categories/${id}/`);
}

// ─── Warehouses ───────────────────────────────────────────────────────────────

// BUG FIX: handles paginated response from StandardResultsSetPagination.
// The backend wraps all ListAPIView responses in { count, next, previous, results }.
export async function getWarehousesApi(params?: { is_active?: boolean }): Promise<Warehouse[]> {
  const { data } = await axiosInstance.get<Warehouse[] | PaginatedResponse<Warehouse>>(
    "/products/warehouses/",
    { params },
  );
  return Array.isArray(data) ? data : data.results;
}

export async function getWarehouseByIdApi(id: number): Promise<Warehouse> {
  const { data } = await axiosInstance.get<Warehouse>(`/products/warehouses/${id}/`);
  return data;
}

export async function createWarehouseApi(payload: CreateWarehousePayload): Promise<Warehouse> {
  const { data } = await axiosInstance.post<Warehouse>("/products/warehouses/", payload);
  return data;
}

export async function updateWarehouseApi(
  id: number,
  payload: UpdateWarehousePayload,
): Promise<Warehouse> {
  const { data } = await axiosInstance.patch<Warehouse>(`/products/warehouses/${id}/`, payload);
  return data;
}

export async function deleteWarehouseApi(id: number): Promise<void> {
  await axiosInstance.delete(`/products/warehouses/${id}/`);
}

// ─── Stock Items ──────────────────────────────────────────────────────────────

export async function getStockItemsApi(
  params?: StockItemsQueryParams,
): Promise<PaginatedResponse<StockItem>> {
  const { data } = await axiosInstance.get<PaginatedResponse<StockItem>>(
    "/products/stock-items/",
    { params },
  );
  return data;
}

export async function getLowStockItemsApi(): Promise<PaginatedResponse<StockItem>> {
  const { data } = await axiosInstance.get<PaginatedResponse<StockItem>>(
    "/products/stock-items/low-stock/",
  );
  return data;
}

// ─── Stock Movements ──────────────────────────────────────────────────────────

export async function getStockMovementsApi(
  params?: StockMovementsQueryParams,
): Promise<PaginatedResponse<StockMovement>> {
  const { data } = await axiosInstance.get<PaginatedResponse<StockMovement>>(
    "/products/stock-movements/",
    { params },
  );
  return data;
}

export async function getStockMovementByIdApi(id: number): Promise<StockMovement> {
  const { data } = await axiosInstance.get<StockMovement>(`/products/stock-movements/${id}/`);
  return data;
}

export async function createStockMovementApi(
  payload: CreateStockMovementPayload,
): Promise<StockMovement> {
  const { data } = await axiosInstance.post<StockMovement>("/products/stock-movements/", payload);
  return data;
}

// ─── Stock Transfers ──────────────────────────────────────────────────────────

export async function getStockTransfersApi(
  params?: StockTransfersQueryParams,
): Promise<PaginatedResponse<StockTransfer>> {
  const { data } = await axiosInstance.get<PaginatedResponse<StockTransfer>>(
    "/products/stock-transfers/",
    { params },
  );
  return data;
}

export async function createStockTransferApi(
  payload: CreateStockTransferPayload,
): Promise<StockTransfer> {
  const { data } = await axiosInstance.post<StockTransfer>(
    "/products/stock-transfers/",
    payload,
  );
  return data;
}