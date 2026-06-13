// src/components/ui/input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-8 w-full rounded-[8px] border border-[#DFE1F0] bg-white",
        "px-2.5 py-1 text-[12px] leading-none text-[#1E1E30]",
        "placeholder:text-[#9898B4]",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[#6F72BE]/25 focus-visible:border-[#6F72BE]",
        "disabled:cursor-not-allowed disabled:bg-[#F6F7FC] disabled:text-[#9898B4]",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";