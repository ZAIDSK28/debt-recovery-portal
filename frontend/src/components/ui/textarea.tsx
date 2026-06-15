// src/components/ui/textarea.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        // Shape / sizing — matches Input baseline
        "min-h-[88px] w-full rounded-[8px]",
        // Border & background — design-system tokens (matches Input/Select)
        "border border-[#DFE1F0] bg-white",
        // Typography
        "px-2.5 py-2 text-[12px] leading-relaxed text-[#1E1E30]",
        // Placeholder
        "placeholder:text-[#9898B4]",
        // Resize
        "resize-y",
        // Transitions
        "transition-colors",
        // Focus — brand colour ring, consistent with Input & Select
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F72BE]/25 focus-visible:border-[#6F72BE]",
        // Disabled
        "disabled:cursor-not-allowed disabled:bg-[#F6F7FC] disabled:text-[#9898B4]",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";