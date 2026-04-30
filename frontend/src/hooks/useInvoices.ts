// src/hooks/useInvoices.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInvoiceReportApi,
  deleteInvoiceReportApi,
  getInvoiceReportByIdApi,
  getInvoiceReportsApi,
  updateInvoiceReportApi,
  type InvoiceReportsQueryParams,
} from "@/api/invoices.api";
import { queryKeys } from "@/hooks/queryKeys";
import type { CreateInvoiceReportPayload } from "@/types";

export function useInvoiceReports(params?: InvoiceReportsQueryParams) {
  return useQuery({
    queryKey: queryKeys.invoiceReports(params),
    queryFn: () => getInvoiceReportsApi(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useInvoiceReport(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.invoiceReportDetail(id),
    queryFn: () => getInvoiceReportByIdApi(id),
    enabled,
  });
}

export function useCreateInvoiceReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInvoiceReportPayload) => createInvoiceReportApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoice-reports"] });
      void queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useUpdateInvoiceReport(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<CreateInvoiceReportPayload>) => updateInvoiceReportApi(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.invoiceReportDetail(id), data);
      void queryClient.invalidateQueries({ queryKey: ["invoice-reports"] });
      void queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useDeleteInvoiceReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteInvoiceReportApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoice-reports"] });
      void queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}