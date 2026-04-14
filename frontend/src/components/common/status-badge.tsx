import { Badge } from "@/components/ui/badge";
import type { BillStatus, ChequeStatus } from "@/types";

export function BillStatusBadge({ status }: { status: BillStatus }) {
  if (status === "cleared") {
    return <Badge className="bg-emerald-100 text-emerald-700">Cleared</Badge>;
  }
  return <Badge className="bg-amber-100 text-amber-700">Open</Badge>;
}

export function ChequeStatusBadge({ status }: { status: ChequeStatus }) {
  if (status === "cleared") return <Badge className="bg-emerald-100 text-emerald-700">Cleared</Badge>;
  if (status === "bounced") return <Badge className="bg-red-100 text-red-700">Bounced</Badge>;
  return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
}