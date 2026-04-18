// src/types/index.ts

export type UserRole = "admin" | "dra";
export type PaymentMethod = "cash" | "upi" | "cheque" | "electronic";
export type ChequeStatus = "pending" | "cleared" | "bounced";
export type ChequeType = "rtgs" | "neft" | "imps";
export type Firm = "NA" | "MZ";
export type BillStatus = "open" | "cleared";
export type InvoiceCreationMode = "bill_only" | "printable_only" | "printable_and_bill";

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
}

export interface Route {
  id: number;
  name: string;
}

export interface Outlet {
  id: number;
  name: string;
  route_id: number;
  route_name: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  outlet: number;
  route_id?: number;
  outlet_name: string;
  route_name: string;
  brand: string;
  actual_amount: string;
  remaining_amount: string;
  overdue_days: number;
  status: BillStatus;
  assigned_to_id?: number | null;
  assigned_to_name?: string | null;
  created_at: string;
  cleared_at?: string | null;
}

export interface Payment {
  id: number;
  bill: number;
  bill_invoice_number: string;
  dra_username: string;
  payment_method: PaymentMethod;
  amount: string;
  transaction_number: string;
  cheque_number: string;
  cheque_date: string | null;
  cheque_type: ChequeType | "";
  cheque_status: ChequeStatus;
  firm: Firm;
  created_at: string;
}

export interface DailySummary {
  date: string;
  cash_total: string;
  upi_total: string;
  cheque_total: string;
  electronic_total: string;
}

export interface TodayTotals {
  cash_total: string;
  upi_total: string;
  cheque_total: string;
  electronic_total: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginOtpResponse {
  requires_otp: true;
}

export interface LoginSuccessResponse extends AuthTokens {
  user: User;
}

export type LoginResponse = LoginOtpResponse | LoginSuccessResponse;

export interface ImportBillsResult {
  imported: number;
  errors: Array<{
    row: number | null;
    message: string;
  }>;
  job_id?: number;
}

export interface ImportBillsStatus {
  id: number;
  status: "processing" | "completed" | "failed";
  total_rows: number;
  processed_rows: number;
  imported: number;
  error_count: number;
  errors: Array<{
    row: number | null;
    message: string;
  }>;
  created_at: string;
  completed_at: string | null;
  percentage: number;
}

export interface InvoiceReportRequestItem {
  description: string;
  quantity: string;
  rate: string;
  amount: string;
}

export interface InvoiceReportResponseItem extends InvoiceReportRequestItem {
  id: number;
}

export interface InvoiceReportPayload {
  items: InvoiceReportRequestItem[];
}

export interface InvoiceReportListItem {
  id: number;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  route_name: string;
  outlet_name: string;
  brand: string;
  total_amount: string;
  creation_mode: InvoiceCreationMode;
  linked_bill_id: number | null;
  created_at: string;
}

export interface InvoiceReport {
  id: number;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  gst_number: string;
  route_name: string;
  outlet_name: string;
  brand: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  notes: string;
  terms: string;
  creation_mode: InvoiceCreationMode;
  linked_bill_id: number | null;
  payload: InvoiceReportPayload;
  items: InvoiceReportResponseItem[];
  created_at: string;
}

export interface CreateInvoiceReportPayload {
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  gst_number: string;
  route_name: string;
  outlet_name: string;
  brand: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  notes: string;
  terms: string;
  creation_mode: InvoiceCreationMode;
  items: InvoiceReportRequestItem[];
}