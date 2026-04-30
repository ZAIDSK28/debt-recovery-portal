// src/components/common/status-badge.tsx

import { Badge } from "@/components/ui/badge";
import type { BillStatus, ChequeStatus, InvoiceStatus } from "@/types";

export function BillStatusBadge({ status }: { status: BillStatus }) {
  if (status === "cleared") {
    return <Badge className="bg-green-100 text-green-700">Cleared</Badge>;
  }

  if (status === "cancelled") {
    return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
  }

  return <Badge className="bg-amber-100 text-amber-700">Open</Badge>;
}

export function ChequeStatusBadge({ status }: { status: ChequeStatus }) {
  if (status === "cleared") return <Badge className="bg-green-100 text-green-700">Cleared</Badge>;
  if (status === "bounced") return <Badge className="bg-red-100 text-red-700">Bounced</Badge>;
  return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === "cancelled") {
    return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
  }

  if (status === "draft") {
    return <Badge className="bg-slate-100 text-slate-700">Draft</Badge>;
  }

  return <Badge className="bg-green-100 text-green-700">Finalized</Badge>;
}