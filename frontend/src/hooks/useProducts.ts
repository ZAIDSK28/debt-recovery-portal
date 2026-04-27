import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProductApi,
  deleteProductApi,
  getProductByIdApi,
  getProductsApi,
  updateProductApi,
  type CreateProductPayload,
  type ProductsQueryParams,
  type UpdateProductPayload,
} from "@/api/products.api";
import { queryKeys } from "@/hooks/queryKeys";

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