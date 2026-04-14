import { axiosInstance } from "@/api/axiosInstance";
import type {
  ChequeStatus,
  DailySummary,
  PaginatedResponse,
  Payment,
  PaymentMethod,
  TodayTotals,
} from "@/types";

export interface RecordPaymentPayload {
  amount: string;
  payment_method: PaymentMethod;
  transaction_number?: string;
  cheque_number?: string;
  cheque_date?: string;
  cheque_type?: "rtgs" | "neft" | "imps";
  cheque_status?: ChequeStatus;
  firm?: "NA" | "MZ";
}

export interface PaymentsQueryParams {
  page?: number;
  page_size?: number;
  payment_method?: PaymentMethod;
  payment_method_in?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  ordering?: string;
}

export async function recordPaymentApi(
  billId: number,
  payload: RecordPaymentPayload
): Promise<Payment> {
  const { data } = await axiosInstance.post<Payment>(`/payments/${billId}/payments/`, payload);
  return data;
}

export async function getPaymentsApi(
  params: PaymentsQueryParams
): Promise<PaginatedResponse<Payment>> {
  const { data } = await axiosInstance.get<PaginatedResponse<Payment>>("/payments/all/", {
    params,
  });
  return data;
}

export async function updatePaymentStatusApi(
  id: number,
  payload: { cheque_status: ChequeStatus }
): Promise<Payment> {
  const { data } = await axiosInstance.patch<Payment>(`/payments/${id}/`, payload);
  return data;
}

export async function getTodayTotalsApi(): Promise<TodayTotals> {
  const { data } = await axiosInstance.get<TodayTotals>("/payments/today-totals/");
  return data;
}

export async function getDailySummaryApi(days = 30): Promise<DailySummary[]> {
  const { data } = await axiosInstance.get<DailySummary[]>("/payments/daily-summary/", {
    params: { days },
  });
  return data;
}

export async function exportPaymentsApi(params?: {
  payment_method?: PaymentMethod;
  payment_method_in?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Blob> {
  const { data } = await axiosInstance.get("/payments/export/", {
    params,
    responseType: "blob",
  });
  return data as Blob;
}