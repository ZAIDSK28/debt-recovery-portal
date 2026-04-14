import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md",
        outline:
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        ghost:
          "text-slate-600 hover:bg-slate-100",
        danger:
          "bg-red-500 text-white hover:bg-red-600 shadow-sm",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
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