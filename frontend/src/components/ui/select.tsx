import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-[10px] border border-[#DFE1F0] bg-white px-3 text-[13px] text-[#1E1E30] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A8ABE8]/60 focus:border-[#A8ABE8] disabled:opacity-50 hover:border-[#A8ABE8]",
        className
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <SelectPrimitive.Icon className="ml-2 shrink-0">
        <ChevronDown className="h-3.5 w-3.5 text-[#A4A6C0]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ children }: { children: ReactNode }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={6}
        collisionPadding={8}
        className="z-50 overflow-hidden rounded-[14px] border border-[#DFE1F0] bg-white shadow-[0_8px_24px_rgba(30,30,48,0.10)]"
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  return (
    <SelectPrimitive.Item
      value={value}
      className="relative flex min-h-8 cursor-pointer select-none items-center rounded-[10px] py-1.5 pl-8 pr-3 text-[13px] text-[#3C3C60] outline-none hover:bg-[#EAEBF8] focus:bg-[#EAEBF8]"
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-3.5 w-3.5 text-[#6F72BE]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}