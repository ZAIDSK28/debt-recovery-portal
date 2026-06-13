// src/lib/toast.ts
import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastType = "success" | "error" | "warning" | "info";

const toastStyles: Record<ToastType, { className: string; descriptionClassName: string }> = {
  success: {
    className: "!rounded-xl !border !border-emerald-200 !bg-emerald-50 !text-emerald-800 !shadow-md",
    descriptionClassName: "!text-emerald-700",
  },
  error: {
    className: "!rounded-xl !border !border-red-200 !bg-red-50 !text-red-800 !shadow-md",
    descriptionClassName: "!text-red-700",
  },
  warning: {
    className: "!rounded-xl !border !border-amber-200 !bg-amber-50 !text-amber-800 !shadow-md",
    descriptionClassName: "!text-amber-700",
  },
  info: {
    className: "!rounded-xl !border !border-sky-200 !bg-sky-50 !text-sky-800 !shadow-md",
    descriptionClassName: "!text-sky-700",
  },
};

function showToast(message: string, type: ToastType, options?: ExternalToast) {
  const style = toastStyles[type];
  sonnerToast(message, {
    ...options,
    className: style.className,
    descriptionClassName: style.descriptionClassName,
  });
}

export const toast = {
  success: (message: string, options?: ExternalToast) => showToast(message, "success", options),
  error: (message: string, options?: ExternalToast) => showToast(message, "error", options),
  warning: (message: string, options?: ExternalToast) => showToast(message, "warning", options),
  info: (message: string, options?: ExternalToast) => showToast(message, "info", options),
  custom: sonnerToast,
};

export { sonnerToast };