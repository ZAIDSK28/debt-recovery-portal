// src/components/ui/input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-gray-200 bg-white/90",
        "px-3 py-2 text-sm font-normal text-gray-800",
        "placeholder:text-gray-400 placeholder:text-sm",
        "transition-all duration-150",
        "focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200/60",
        "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
        "hover:border-gray-300",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";