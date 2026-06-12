// src/components/payments/cheque-status-select.tsx
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdatePaymentStatus } from "@/hooks/usePayments";
import { getApiError } from "@/lib/utils";
import type { ChequeStatus } from "@/types";

type UpdatableChequeStatus = "pending" | "cleared" | "bounced";

function isUpdatable(status: ChequeStatus): status is UpdatableChequeStatus {
  return status === "pending" || status === "cleared" || status === "bounced";
}

const STATUS_STYLES: Record<UpdatableChequeStatus, string> = {
  pending:  "text-[#D97B0A]",
  cleared:  "text-[#22A55A]",
  bounced:  "text-[#E04E6A]",
};

export function ChequeStatusSelect({
  paymentId,
  value,
}: {
  paymentId: number;
  value: ChequeStatus;
}) {
  const mutation = useUpdatePaymentStatus();
  const resolvedValue = isUpdatable(value) ? value : "pending";

  async function handleChange(next: UpdatableChequeStatus) {
    try {
      await mutation.mutateAsync({ id: paymentId, cheque_status: next });
      toast.success("Status updated");
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <Select
      value={resolvedValue}
      onValueChange={(v) => void handleChange(v as UpdatableChequeStatus)}
      disabled={mutation.isPending}
    >
      <SelectTrigger
        className={`h-6 w-[100px] rounded-[6px] border-[#DFE1F0] bg-[#F6F7FC] px-2 text-[11px] font-semibold ${STATUS_STYLES[resolvedValue]}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending"><span className="text-[12px]">Pending</span></SelectItem>
        <SelectItem value="cleared"><span className="text-[12px]">Cleared</span></SelectItem>
        <SelectItem value="bounced"><span className="text-[12px]">Bounced</span></SelectItem>
      </SelectContent>
    </Select>
  );
}