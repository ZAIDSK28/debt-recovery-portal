import { useEffect, useState } from "react";
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
  const [localValue, setLocalValue] = useState<ChequeStatus>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  async function handleChange(nextValue: string) {
    const previousValue = localValue;
    const nextStatus = nextValue as ChequeStatus;
    setLocalValue(nextStatus);

    try {
      await mutation.mutateAsync({
        id: paymentId,
        cheque_status: nextStatus,
      });
      toast.success("Status updated");
    } catch (error) {
      setLocalValue(previousValue);
      toast.error(getApiError(error));
    }
  }

  return (
    <Select value={localValue} onValueChange={handleChange}>
      <SelectTrigger className="w-[138px]">
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