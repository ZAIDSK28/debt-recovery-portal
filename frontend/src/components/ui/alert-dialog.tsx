import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

export function AlertDialogContent({ children }: { children: ReactNode }) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/25 backdrop-blur-sm" />
      <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-red-500 to-orange-500" />
        <div className="p-6">{children}</div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-3">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: ReactNode }) {
  return <AlertDialogPrimitive.Title className="text-lg font-semibold text-slate-900">{children}</AlertDialogPrimitive.Title>;
}

export function AlertDialogDescription({ children }: { children: ReactNode }) {
  return <AlertDialogPrimitive.Description className="mt-2 text-sm text-slate-600">{children}</AlertDialogPrimitive.Description>;
}

export function AlertDialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex justify-end gap-3">{children}</div>;
}