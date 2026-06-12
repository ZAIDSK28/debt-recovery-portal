// src/components/common/status-badge.tsx
import { Badge } from "@/components/ui/badge";
import type { BillStatus, ChequeStatus, InvoiceStatus } from "@/types";

export function BillStatusBadge({ status }: { status: BillStatus }) {
  if (status === "cleared") return <Badge variant="success">Cleared</Badge>;
  if (status === "cancelled") return <Badge variant="danger">Cancelled</Badge>;
  return <Badge variant="warning">Open</Badge>;
}

export function ChequeStatusBadge({ status }: { status: ChequeStatus }) {
  if (status === "cleared") return <Badge variant="success">Cleared</Badge>;
  if (status === "bounced") return <Badge variant="danger">Bounced</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === "cancelled") return <Badge variant="danger">Cancelled</Badge>;
  if (status === "draft") return <Badge variant="muted">Draft</Badge>;
  return <Badge variant="success">Finalized</Badge>;
}