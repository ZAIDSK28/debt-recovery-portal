// src/components/bills/import-bills-dialog.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, XCircle } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getImportBillsStatusApi } from "@/api/bills.api";
import { useImportBills } from "@/hooks/useBills";
import { getApiError } from "@/lib/utils";
import type { ImportBillsStatus } from "@/types";

type ImportUiState = "idle" | "uploading" | "processing" | "completed" | "failed";

export function ImportBillsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [importState, setImportState] = useState<ImportUiState>("idle");
  const [importStatus, setImportStatus] = useState<ImportBillsStatus | null>(null);
  const autoCloseTimeoutRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  const importMutation = useImportBills();

  useEffect(() => {
    if (!open) {
      setFile(null);
      setJobId(null);
      setProgress(0);
      setImportState("idle");
      setImportStatus(null);

      if (autoCloseTimeoutRef.current) {
        window.clearTimeout(autoCloseTimeoutRef.current);
        autoCloseTimeoutRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (autoCloseTimeoutRef.current) {
        window.clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open || !jobId || importState !== "processing") return;

    let active = true;

    const poll = async () => {
      try {
        const status = await getImportBillsStatusApi(jobId);
        if (!active) return;

        setImportStatus(status);
        setProgress(status.percentage ?? 0);

        if (status.status === "completed") {
          setImportState("completed");
          await queryClient.invalidateQueries({ queryKey: ["bills"] });

          toast.success(
            status.error_count > 0
              ? `Import completed. ${status.imported} imported with ${status.error_count} errors.`
              : `Import completed. ${status.imported} bills imported successfully.`
          );

          autoCloseTimeoutRef.current = window.setTimeout(() => {
            onOpenChange(false);
          }, 2000);
          return;
        }

        if (status.status === "failed") {
          setImportState("failed");
          toast.error("Import failed.");
        }
      } catch (error) {
        if (!active) return;
        setImportState("failed");
        toast.error(getApiError(error));
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [jobId, importState, open, onOpenChange, queryClient]);

  async function handleImport() {
    if (!file) {
      toast.error("Please choose an Excel file.");
      return;
    }

    try {
      setImportState("uploading");

      const result = await importMutation.mutateAsync(file);

      if (typeof result.job_id === "number") {
        setJobId(result.job_id);
        setImportState("processing");
        setProgress(0);
        toast.success("Import started");
        return;
      }

      if (result.errors.length > 0) {
        toast.warning(`Imported ${result.imported} rows with ${result.errors.length} errors.`);
      } else {
        toast.success(`Imported ${result.imported} bills successfully.`);
      }

      setImportStatus({
        id: 0,
        status: "completed",
        total_rows: result.imported + result.errors.length,
        processed_rows: result.imported + result.errors.length,
        imported: result.imported,
        error_count: result.errors.length,
        errors: result.errors,
        created_at: "",
        completed_at: "",
        percentage: 100,
      });
      setProgress(100);
      setImportState("completed");
      await queryClient.invalidateQueries({ queryKey: ["bills"] });

      autoCloseTimeoutRef.current = window.setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      setImportState("failed");
      toast.error(getApiError(error));
    }
  }

  const canClose = useMemo(
    () => importState !== "uploading" && importState !== "processing",
    [importState]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !canClose) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Bills</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload an XLSX file containing invoice_number, invoice_date, route_name, outlet_name, brand, and actual_amount.
            </p>

            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".xlsx,.xls"
                disabled={importState === "uploading" || importState === "processing"}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="flex-1"
              />
              {file && importState === "idle" && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>

            {(importState === "processing" || importState === "completed" || importState === "failed") && (
              <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      importState === "failed" ? "bg-red-500" : "bg-[#6F72BE]"
                    }`}
                    style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {importState === "processing"
                      ? "Import in progress"
                      : importState === "completed"
                        ? "Import completed"
                        : "Import failed"}
                  </span>
                  <span className="font-medium text-gray-900">{progress}%</span>
                </div>

                {importState === "completed" && (
                  <p className="text-xs text-gray-500">Closing automatically in a few seconds...</p>
                )}

                {importStatus && (
                  <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="text-gray-500">Status</p>
                      <p className="font-semibold capitalize text-gray-900">{importStatus.status}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="text-gray-500">Processed</p>
                      <p className="font-semibold text-gray-900">
                        {importStatus.processed_rows}/{importStatus.total_rows}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="text-gray-500">Imported</p>
                      <p className="font-semibold text-gray-900">{importStatus.imported}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="text-gray-500">Errors</p>
                      <p className="font-semibold text-red-600">{importStatus.error_count}</p>
                    </div>
                  </div>
                )}

                {/* Error list without download button */}
                {importStatus && importStatus.errors.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Error details</p>
                    <div className="max-h-48 overflow-auto rounded-lg border border-gray-200 bg-white">
                      <table className="min-w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50">
                          <tr className="border-b border-gray-200">
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Row</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Error Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importStatus.errors.map((error, idx) => (
                            <tr key={idx} className="border-t border-gray-100">
                              <td className="px-3 py-2 text-gray-700">{error.row ?? "—"}</td>
                              <td className="px-3 py-2 text-red-600">{error.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {importState === "failed" && !importStatus && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <XCircle className="h-4 w-4" />
                    The import could not be completed. Please try again.
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          {importState === "completed" || importState === "failed" ? (
            <Button onClick={() => onOpenChange(false)} className="h-9 text-sm">Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={!canClose} className="h-9 text-sm">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!file || importMutation.isPending || importState === "processing"}
                className="h-9 text-sm"
              >
                {importState === "uploading"
                  ? "Uploading..."
                  : importState === "processing"
                    ? "Processing..."
                    : "Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}