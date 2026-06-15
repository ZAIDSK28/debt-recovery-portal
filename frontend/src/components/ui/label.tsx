// src/components/ui/label.tsx
import * as LabelPrimitive from "@radix-ui/react-label";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        // Typography — consistent 12px label matching table/form density
        "block text-[12px] font-semibold text-[#3C3C60]",
        // Cursor for associated inputs
        "cursor-default select-none",
        // Disabled-via-peer state
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}