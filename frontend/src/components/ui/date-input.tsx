import { CalendarDays, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DateInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  clearable = false,
  min,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="pl-9 pr-10"
      />
      {clearable && value ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-lg"
          onClick={() => onChange("")}
          aria-label="Clear date"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}