import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
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
  return format(new Date(iso), "dd MMM yyyy");
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

    if (typeof data === "string") return data;

    if (typeof data === "object" && data !== null) {
      if ("detail" in data && typeof data.detail === "string") {
        return data.detail;
      }

      const values = Object.values(data);
      const first = values[0];
      if (typeof first === "string") return first;
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    }
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