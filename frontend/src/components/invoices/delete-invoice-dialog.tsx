// src/components/invoices/delete-invoice-dialog.tsx
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

  async function handleDelete() {
    if (!invoiceId) return;

    try {
      await deleteMutation.mutateAsync(invoiceId);
      toast.success("Invoice deleted");
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getApiError(error));
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
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}