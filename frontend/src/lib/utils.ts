import { clsx, type ClassValue } from "clsx";
import { format, isValid } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isNaN(amount) ? 0 : amount);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";

  const parsed = new Date(iso);
  if (!isValid(parsed)) return "—";

  return format(parsed, "dd MMM yyyy");
}

export function overdueSeverity(days: number): "low" | "medium" | "high" {
  if (days >= 60) return "high";
  if (days >= 30) return "medium";
  return "low";
}

export function getApiError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data;

    if (typeof data === "string" && data.trim()) return data;

    if (typeof data === "object" && data !== null) {
      if ("detail" in data && typeof data.detail === "string" && data.detail.trim()) {
        return data.detail;
      }

      const values = Object.values(data);
      for (const value of values) {
        if (typeof value === "string" && value.trim()) return value;
        if (Array.isArray(value)) {
          const firstString = value.find((item) => typeof item === "string" && item.trim());
          if (typeof firstString === "string") return firstString;
        }
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function fallbackBillsExportFileName(params?: {
  start_date?: string;
  end_date?: string;
}): string {
  if (params?.start_date && params?.end_date) {
    return `bills_${params.start_date}_to_${params.end_date}.xlsx`;
  }
  if (params?.start_date) {
    return `bills_from_${params.start_date}.xlsx`;
  }
  if (params?.end_date) {
    return `bills_until_${params.end_date}.xlsx`;
  }
  return "bills_export.xlsx";
}