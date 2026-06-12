// src/api/invoices.api.ts
import { axiosInstance } from "@/api/axiosInstance";
import type {
  CreateInvoiceReportPayload,
  InvoiceReport,
  InvoiceReportListItem,
  PaginatedResponse,
} from "@/types";

export interface InvoiceReportsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export interface InvoiceSequenceSetting {
  id: number;
  name: string;
  prefix: string;
  date_format: string;
  separator: string;
  next_number: number;
  padding: number;
  is_active: boolean;
  updated_at: string;
  preview_invoice_number: string;
}

export async function createInvoiceReportApi(
  payload: CreateInvoiceReportPayload
): Promise<InvoiceReport> {
  const { data } = await axiosInstance.post<InvoiceReport>("/reports/invoices/", payload);
  return data;
}

export async function getInvoiceReportsApi(
  params?: InvoiceReportsQueryParams
): Promise<PaginatedResponse<InvoiceReportListItem>> {
  const { data } = await axiosInstance.get<PaginatedResponse<InvoiceReportListItem>>(
    "/reports/invoices/",
    { params }
  );
  return data;
}

export async function getInvoiceReportByIdApi(id: number): Promise<InvoiceReport> {
  const { data } = await axiosInstance.get<InvoiceReport>(`/reports/invoices/${id}/`);
  return data;
}

export async function updateInvoiceReportApi(
  id: number,
  payload: Partial<CreateInvoiceReportPayload>
): Promise<InvoiceReport> {
  const { data } = await axiosInstance.patch<InvoiceReport>(`/reports/invoices/${id}/`, payload);
  return data;
}

export async function deleteInvoiceReportApi(id: number): Promise<void> {
  await axiosInstance.delete(`/reports/invoices/${id}/`);
}

export async function getPrintableInvoiceHtmlApi(id: number): Promise<string> {
  const { data } = await axiosInstance.get<string>(`/reports/invoices/${id}/print/`, {
    responseType: "text",
    transformResponse: [(value) => value],
  });
  return data;
}

export async function downloadInvoicePdfApi(id: number): Promise<Blob> {
  const { data } = await axiosInstance.get(`/reports/invoices/${id}/pdf/`, {
    responseType: "blob",
  });
  return data as Blob;
}

export async function getInvoiceSequenceSettingApi(): Promise<InvoiceSequenceSetting> {
  const { data } = await axiosInstance.get<InvoiceSequenceSetting>("/reports/invoice-sequence-setting/");
  return data;
}

export async function updateInvoiceSequenceSettingApi(
  payload: Partial<Omit<InvoiceSequenceSetting, "id" | "updated_at" | "preview_invoice_number">>
): Promise<InvoiceSequenceSetting> {
  const { data } = await axiosInstance.patch<InvoiceSequenceSetting>(
    "/reports/invoice-sequence-setting/",
    payload
  );
  return data;
}