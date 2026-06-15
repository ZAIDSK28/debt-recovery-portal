// src/components/common/export-with-date-range.tsx
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { getApiError } from "@/lib/utils";

interface ExportWithDateRangeProps {
  exportFn: (params: { start_date?: string; end_date?: string }) => Promise<Blob>;
  defaultFilename: string;
  initialStartDate?: string;
  initialEndDate?: string;
  onSuccess?: () => void;
  buttonVariant?: "default" | "outline" | "ghost";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonText?: string;
}

export function ExportWithDateRange({
  exportFn,
  defaultFilename,
  initialStartDate = "",
  initialEndDate = "",
  onSuccess,
  buttonVariant = "outline",
  buttonSize = "default",  // changed from "sm" to "default"
  buttonText = "Export",
}: ExportWithDateRangeProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (startDate && endDate && startDate > endDate) {
      toast.error("Start date cannot be after end date.");
      return;
    }

    setIsExporting(true);
    try {
      const blob = await exportFn({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });

      let filename = defaultFilename;
      if (startDate && endDate) {
        filename = `${defaultFilename.replace(/\.xlsx$/, "")}_${startDate}_to_${endDate}.xlsx`;
      } else if (startDate) {
        filename = `${defaultFilename.replace(/\.xlsx$/, "")}_from_${startDate}.xlsx`;
      } else if (endDate) {
        filename = `${defaultFilename.replace(/\.xlsx$/, "")}_until_${endDate}.xlsx`;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Export started");
      onSuccess?.();
      setOpen(false);
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setIsExporting(false);
    }
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export {defaultFilename.replace(/\.xlsx$/, "")}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Select a date range to filter exported records.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Start date (optional)</Label>
                <DateInput
                  value={startDate}
                  onChange={setStartDate}
                  clearable
                  max={endDate || undefined}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End date (optional)</Label>
                <DateInput
                  value={endDate}
                  onChange={setEndDate}
                  clearable
                  min={startDate || undefined}
                />
              </div>
            </div>
            {(startDate || endDate) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-xs"
              >
                Clear dates
              </Button>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}