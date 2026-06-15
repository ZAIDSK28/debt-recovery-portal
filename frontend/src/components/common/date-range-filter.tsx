// src/components/common/date-range-filter.tsx
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  className,
}: DateRangeFilterProps) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] text-[#9898B4]">From</Label>
          <DateInput
            value={startDate}
            onChange={onStartDateChange}
            clearable
            max={endDate || undefined}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] text-[#9898B4]">To</Label>
          <DateInput
            value={endDate}
            onChange={onEndDateChange}
            clearable
            min={startDate || undefined}
          />
        </div>
        {onClear && (startDate || endDate) && (
          <button
            onClick={onClear}
            className="text-xs text-[#9898B4] hover:text-[#6F72BE] underline underline-offset-2"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}