import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

export function AlertDialogContent({ children }: { children: ReactNode }) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#1E1E30]/25 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
      <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] border border-[#DFE1F0] bg-white shadow-[0_16px_48px_rgba(30,30,48,0.16)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">
        <div className="h-[3px] w-full rounded-t-[20px] bg-[#E04E6A]" />
        <div className="p-5">{children}</div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-3">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: ReactNode }) {
  return (
    <AlertDialogPrimitive.Title className="text-[15px] font-semibold text-[#1E1E30]">
      {children}
    </AlertDialogPrimitive.Title>
  );
}

export function AlertDialogDescription({ children }: { children: ReactNode }) {
  return (
    <AlertDialogPrimitive.Description className="mt-2 text-[13px] leading-relaxed text-[#6B6B8A]">
      {children}
    </AlertDialogPrimitive.Description>
  );
}

export function AlertDialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex justify-end gap-2.5">{children}</div>;
}