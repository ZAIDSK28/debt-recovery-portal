// src/components/payments/cheque-status-select.tsx
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdatePaymentStatus } from "@/hooks/usePayments";
import { getApiError } from "@/lib/utils";
import type { ChequeStatus } from "@/types";

type UpdatableChequeStatus = "pending" | "cleared" | "bounced";

function isUpdatableChequeStatus(status: ChequeStatus): status is UpdatableChequeStatus {
  return status === "pending" || status === "cleared" || status === "bounced";
}

export function ChequeStatusSelect({
  paymentId,
  value,
}: {
  paymentId: number;
  value: ChequeStatus;
}) {
  const mutation = useUpdatePaymentStatus();

  async function handleChange(nextStatus: UpdatableChequeStatus) {
    try {
      await mutation.mutateAsync({
        id: paymentId,
        cheque_status: nextStatus,
      });
      toast.success("Status updated");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <Select
      value={isUpdatableChequeStatus(value) ? value : "pending"}
      onValueChange={(value) => void handleChange(value as UpdatableChequeStatus)}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="cleared">Cleared</SelectItem>
        <SelectItem value="bounced">Bounced</SelectItem>
      </SelectContent>
    </Select>
  );
}