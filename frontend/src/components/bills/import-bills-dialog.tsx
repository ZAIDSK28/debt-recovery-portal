import { useState } from "react";
import { toast } from "sonner";
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
import { useImportBills } from "@/hooks/useBills";
import { getApiError } from "@/lib/utils";

export function ImportBillsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const importMutation = useImportBills();

  async function handleImport() {
    if (!file) {
      toast.error("Please choose an Excel file.");
      return;
    }

    try {
      const result = await importMutation.mutateAsync(file);
      if (result.errors.length > 0) {
        toast.warning(`Imported ${result.imported} rows with ${result.errors.length} errors.`);
      } else {
        toast.success(`Imported ${result.imported} bills successfully.`);
      }
      onOpenChange(false);
      setFile(null);
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Bills</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Upload an XLSX file containing invoice_number, invoice_date, route_name, outlet_name, brand, and actual_amount.
            </p>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importMutation.isPending}>
            {importMutation.isPending ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}