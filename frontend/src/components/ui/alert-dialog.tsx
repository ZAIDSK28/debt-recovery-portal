import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

export function AlertDialogContent({ children }: { children: ReactNode }) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
      <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">
        <div className="h-1 w-full bg-gradient-to-r from-red-500 to-orange-500" />
        <div className="p-5">{children}</div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-3">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: ReactNode }) {
  return <AlertDialogPrimitive.Title className="text-base font-semibold text-slate-900">{children}</AlertDialogPrimitive.Title>;
}

export function AlertDialogDescription({ children }: { children: ReactNode }) {
  return <AlertDialogPrimitive.Description className="mt-2 text-sm text-slate-600">{children}</AlertDialogPrimitive.Description>;
}

export function AlertDialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex justify-end gap-2.5">{children}</div>;
}