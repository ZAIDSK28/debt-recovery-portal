import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdatePaymentStatus } from "@/hooks/usePayments";
import { getApiError } from "@/lib/utils";
import type { ChequeStatus } from "@/types";

export function ChequeStatusSelect({
  paymentId,
  value,
}: {
  paymentId: number;
  value: ChequeStatus;
}) {
  const mutation = useUpdatePaymentStatus();

  async function handleChange(nextValue: string) {
    try {
      await mutation.mutateAsync({
        id: paymentId,
        cheque_status: nextValue as ChequeStatus,
      });
      toast.success("Status updated");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="cleared">Cleared</SelectItem>
        <SelectItem value="bounced">Bounced</SelectItem>
      </SelectContent>
    </Select>
  );
}