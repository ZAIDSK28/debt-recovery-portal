import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 active:scale-[0.985]",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,#7dd3fc,#38bdf8,#0ea5e9)] text-white shadow-[0_6px_18px_rgba(56,189,248,0.28)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(56,189,248,0.35)]",
        outline:
          "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-800",
        danger:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 hover:shadow-md",
      },
      size: {
        default: "h-9 px-4 py-1.5",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-10 px-5",
        icon: "h-8.5 w-8.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  }
);

Button.displayName = "Button";