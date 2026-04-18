// src/hooks/useInvoices.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInvoiceReportApi,
  getInvoiceReportByIdApi,
  getInvoiceReportsApi,
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