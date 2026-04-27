// src/api/products.api.ts
import { axiosInstance } from "@/api/axiosInstance";
import type { PaginatedResponse, Product } from "@/types";

export interface ProductsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface CreateProductPayload {
  product_code: string;
  category: string;
  name: string;
  price: string;
  default_quantity: string;
  tax_rate: string;
  is_active: boolean;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {}

export async function getProductsApi(
  params?: ProductsQueryParams
): Promise<PaginatedResponse<Product>> {
  const { data } = await axiosInstance.get<PaginatedResponse<Product>>("/products/", {
    params,
  });
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