import { axiosInstance } from "@/api/axiosInstance";
import type {
  ImportBillsResult,
  ImportBillsStatus,
  Invoice,
  PaginatedResponse,
} from "@/types";

export interface BillsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  status?: string;
  assigned_to_id?: number;
}

export interface CreateBillPayload {
  invoice_number: string;
  invoice_date: string;
  outlet: number;
  brand: string;
  actual_amount: string;
  remaining_amount?: string;
  assigned_to?: number | null;
}

export interface UpdateBillPayload extends Partial<CreateBillPayload> {}

export interface AssignBillsPayload {
  bill_ids: number[];
  assigned_to?: number | null;
}

export async function getBillsApi(params: BillsQueryParams): Promise<PaginatedResponse<Invoice>> {
  const { data } = await axiosInstance.get<PaginatedResponse<Invoice>>("/bills/", { params });
  return data;
}

export async function createBillApi(payload: CreateBillPayload): Promise<Invoice> {
  const { data } = await axiosInstance.post<Invoice>("/bills/", payload);
  return data;
}

export async function updateBillApi(id: number, payload: UpdateBillPayload): Promise<Invoice> {
  const { data } = await axiosInstance.patch<Invoice>(`/bills/${id}/`, payload);
  return data;
}

export async function deleteBillApi(id: number): Promise<void> {
  await axiosInstance.delete(`/bills/${id}/`);
}

export async function assignBillsApi(payload: AssignBillsPayload): Promise<Invoice[]> {
  const { data } = await axiosInstance.post<Invoice[]>("/bills/assign/", payload);
  return data;
}

export async function exportBillsApi(params?: { start_date?: string; end_date?: string }): Promise<Blob> {
  const { data } = await axiosInstance.get("/bills/export/", {
    params,
    responseType: "blob",
  });
  return data as Blob;
}

export async function exportBillsWithMetaApi(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{ blob: Blob; filename?: string }> {
  const response = await axiosInstance.get("/bills/export/", {
    params,
    responseType: "blob",
  });

  const disposition = response.headers["content-disposition"] as string | undefined;
  const filename = disposition
    ? /filename\*?=(?:UTF-8''|")?([^";]+)"?/i.exec(disposition)?.[1]
    : undefined;

  return {
    blob: response.data as Blob,
    filename: filename ? decodeURIComponent(filename) : undefined,
  };
}

export async function importBillsApi(file: File): Promise<ImportBillsResult> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await axiosInstance.post<ImportBillsResult>("/bills/import/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export async function getImportBillsStatusApi(jobId: number): Promise<ImportBillsStatus> {
  const { data } = await axiosInstance.get<ImportBillsStatus>(`/bills/import/${jobId}/status/`);
  return data;
}

export interface AssignmentParams {
  page?: number;
  page_size?: number;
  search?: string;
  mode?: "invoice_number" | "route_name" | "outlet_name";
  ordering?: string;
}

export async function getMyAssignmentsApi(
  params: AssignmentParams
): Promise<PaginatedResponse<Invoice>> {
  const { data } = await axiosInstance.get<PaginatedResponse<Invoice>>(
    "/my-assignments-flat/",
    { params }
  );
  return data;
} 