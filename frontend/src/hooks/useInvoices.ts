// src/hooks/useInvoices.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInvoiceReportApi,
  deleteInvoiceReportApi,
  getInvoiceReportByIdApi,
  getInvoiceReportsApi,
  getInvoiceSequenceSettingApi,
  updateInvoiceReportApi,
  updateInvoiceSequenceSettingApi,
  type InvoiceReportsQueryParams,
  type InvoiceSequenceSetting,
} from "@/api/invoices.api";
import { queryKeys } from "@/hooks/queryKeys";
import type { CreateInvoiceReportPayload } from "@/types";

const invoiceSequenceKeys = {
  detail: ["invoice-sequence-setting"] as const,
};

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

export function useInvoiceSequenceSetting() {
  return useQuery({
    queryKey: invoiceSequenceKeys.detail,
    queryFn: getInvoiceSequenceSettingApi,
  });
}

export function useUpdateInvoiceSequenceSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: Partial<Omit<InvoiceSequenceSetting, "id" | "updated_at" | "preview_invoice_number">>
    ) => updateInvoiceSequenceSettingApi(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(invoiceSequenceKeys.detail, data);
    },
  });
}