// src/components/ui/button.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center font-semibold leading-none",
    "transition-all duration-150 disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F72BE]/30",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "rounded-[10px] bg-[#6F72BE] text-white shadow-[0_1px_4px_rgba(111,114,190,0.25)] hover:bg-[#5D60A8]",
        outline:
          "rounded-[8px] border border-[#DFE1F0] bg-white text-[#1E1E30] hover:border-[#6F72BE] hover:bg-[#EAEBF8] hover:text-[#6F72BE]",
        ghost:
          "rounded-[8px] text-[#6B6B8A] hover:bg-[#EAEBF8] hover:text-[#6F72BE]",
        danger:
          "rounded-[10px] bg-[#E04E6A] text-white shadow-[0_1px_4px_rgba(224,78,106,0.25)] hover:bg-[#C9405A]",
      },
      size: {
        // All text sizes locked to 12px to match table cell density.
        // Height stays as-is so touch targets remain comfortable.
        default:   "h-8  px-3.5 text-[12px]",
        sm:        "h-7  px-2.5 text-[12px]",
        xs:        "h-6  px-2   text-[11px]",
        lg:        "h-9  px-5   text-[13px]",
        icon:      "h-7  w-7",
        "icon-xs": "h-6  w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";