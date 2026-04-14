import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssignBill } from "@/hooks/useBills";
import { getApiError } from "@/lib/utils";
import type { User } from "@/types";

export function AssignAgentSelect({
  billId,
  users,
  currentAssignedToId,
}: {
  billId: number;
  users: User[];
  currentAssignedToId?: number | null;
}) {
  const [value, setValue] = useState<string>(currentAssignedToId ? String(currentAssignedToId) : "unassigned");
  const assignMutation = useAssignBill();

  async function handleChange(nextValue: string) {
    const previous = value;
    setValue(nextValue);

    try {
      await assignMutation.mutateAsync({
        bill_ids: [billId],
        assigned_to: nextValue === "unassigned" ? null : Number(nextValue),
      });
      toast.success("Assignment updated");
    } catch (error) {
      setValue(previous);
      toast.error(getApiError(error));
    }
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Assign agent" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={String(user.id)}>
            {user.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}