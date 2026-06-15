// src/components/invoices/delete-invoice-dialog.tsx
import { useState } from "react";
import { toast } from "@/lib/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteInvoiceReport } from "@/hooks/useInvoices";
import { getApiError } from "@/lib/utils";

export function DeleteInvoiceDialog({
  open,
  onOpenChange,
  invoiceId,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number | null;
  onDeleted?: () => void;
}) {
  const deleteMutation = useDeleteInvoiceReport();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!invoiceId || isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteMutation.mutateAsync(invoiceId);
      toast.success("Invoice deleted");
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      // Ignore 404 errors – the invoice is already gone
      const apiError = getApiError(error);
      if (apiError.toLowerCase().includes("not found") || apiError.toLowerCase().includes("no printableinvoice matches")) {
        // Already deleted – treat as success
        toast.success("Invoice already deleted");
        onOpenChange(false);
        onDeleted?.();
      } else {
        toast.error(apiError);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
          <AlertDialogDescription>
            Deleting this invoice will also permanently delete its linked bill and all related payments.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={isDeleting}>Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="danger" 
              onClick={handleDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}