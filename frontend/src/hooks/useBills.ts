// src/hooks/useBills.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignBillsApi,
  createBillApi,
  deleteBillApi,
  getBillsApi,
  getMyAssignmentsApi,
  importBillsApi,
  updateBillApi,
  type AssignmentParams,
  type BillsQueryParams,
  type CreateBillPayload,
  type UpdateBillPayload,
} from "@/api/bills.api";
import { queryKeys } from "@/hooks/queryKeys";

export function useBills(params: BillsQueryParams) {
  return useQuery({
    queryKey: queryKeys.bills(params),
    queryFn: () => getBillsApi(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useMyAssignments(params: AssignmentParams) {
  return useQuery({
    queryKey: queryKeys.myAssignments(params),
    queryFn: () => getMyAssignmentsApi(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBillPayload) => createBillApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateBillPayload }) =>
      updateBillApi(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bills"] });
      void queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteBillApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bills"] });
      void queryClient.invalidateQueries({ queryKey: ["invoice-reports"] });
      void queryClient.invalidateQueries({ queryKey: ["invoice-report"] });
    },
  });
}

export function useAssignBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignBillsApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bills"] });
      void queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
    },
  });
}

export function useImportBills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => importBillsApi(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}