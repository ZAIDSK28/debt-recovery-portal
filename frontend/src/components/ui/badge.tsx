// src/components/ui/badge.tsx
import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[20px] px-2.5 py-0.5 text-[11px] font-semibold",
  {
    variants: {
      variant: {
        default:  "bg-[#EAEBF8] text-[#6F72BE]",
        success:  "bg-[#E3F7EC] text-[#22A55A]",
        warning:  "bg-[#FFF0DC] text-[#D97B0A]",
        danger:   "bg-[#FDEEF1] text-[#E04E6A]",
        muted:    "bg-[#F6F7FC] text-[#9898B4]",
        outline:  "border border-[#DFE1F0] text-[#6B6B8A]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}