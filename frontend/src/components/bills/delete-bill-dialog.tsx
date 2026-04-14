import { toast } from "sonner";
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
import { useDeleteBill } from "@/hooks/useBills";
import { getApiError } from "@/lib/utils";

export function DeleteBillDialog({
  open,
  onOpenChange,
  billId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: number | null;
}) {
  const deleteMutation = useDeleteBill();

  async function handleDelete() {
    if (!billId) return;

    try {
      await deleteMutation.mutateAsync(billId);
      toast.success("Invoice deleted");
      onOpenChange(false);
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
            This action cannot be undone. The selected invoice will be removed permanently.
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