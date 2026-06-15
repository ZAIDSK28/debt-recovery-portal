// src/lib/auditParser.ts
import type { AuditLog } from "@/api/audit.api";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface ParsedAuditLog {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  description: string;
  ipAddress: string | null;
  rawMetadata: Record<string, any>;
}

const ACTION_MAP: Record<string, string> = {
  "bill.created": "Created bill",
  "bill.updated": "Updated bill",
  "bill.deleted": "Deleted bill",
  "bill.assigned": "Assigned bill",
  "bill.imported": "Imported bills",
  "payment.recorded": "Recorded payment",
  "payment.status_updated": "Updated payment status",
  "printable_invoice.created": "Created printable invoice",
  "user.created": "Created user",
  "user.updated": "Updated user",
  "user.password_set": "Set user password",
  "user.activated": "Activated user",
  "user.deactivated": "Deactivated user",
  "stock.transfer.created": "Transferred stock",
  "dashboard.daily_metrics.rebuilt": "Rebuilt dashboard metrics",
  "auth.login.success": "Logged in",
  "auth.login.otp_requested": "Requested OTP",
  "auth.otp.verified": "Verified OTP",
  "auth.otp.resent": "Resent OTP",
};

const ENTITY_MAP: Record<string, string> = {
  bill: "Bill",
  payment: "Payment",
  printable_invoice: "Invoice",
  user: "User",
  StockTransfer: "Stock Transfer",
  dashboard: "Dashboard",
  bill_import: "Bill Import",
};

function formatAction(action: string): string {
  return ACTION_MAP[action] || action.replace(/\./g, " ").replace(/_/g, " ").trim();
}

function formatEntity(entityType: string): string {
  return ENTITY_MAP[entityType] || entityType.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim();
}

function getBillDescription(meta: Record<string, any>): string {
  const parts: string[] = [];
  if (meta.invoice_number) parts.push(`invoice ${meta.invoice_number}`);
  if (meta.old_assigned_to && meta.new_assigned_to !== undefined) {
    parts.push(`from ${meta.old_assigned_to || "unassigned"} to ${meta.new_assigned_to || "unassigned"}`);
  }
  if (meta.imported !== undefined) {
    return `imported ${meta.imported} bills (${meta.errors || 0} errors)`;
  }
  return parts.join(" · ") || "No additional details";
}

function getPaymentDescription(meta: Record<string, any>): string {
  const parts: string[] = [];
  if (meta.invoice_number) parts.push(`invoice ${meta.invoice_number}`);
  if (meta.payment_method) parts.push(`via ${meta.payment_method.toUpperCase()}`);
  if (meta.amount) parts.push(`₹${parseFloat(meta.amount).toFixed(2)}`);
  if (meta.old_status && meta.new_status) parts.push(`status: ${meta.old_status} → ${meta.new_status}`);
  return parts.join(" · ") || "No additional details";
}

function getInvoiceDescription(meta: Record<string, any>): string {
  const parts: string[] = [];
  if (meta.invoice_number) parts.push(`invoice ${meta.invoice_number}`);
  if (meta.creation_mode) parts.push(`mode: ${meta.creation_mode.replace("_", " ")}`);
  if (meta.linked_bill_id) parts.push(`linked bill #${meta.linked_bill_id}`);
  return parts.join(" · ") || "No additional details";
}

function getUserDescription(meta: Record<string, any>): string {
  const parts: string[] = [];
  if (meta.username) parts.push(`username: ${meta.username}`);
  if (meta.role) parts.push(`role: ${meta.role.toUpperCase()}`);
  if (meta.is_active !== undefined) parts.push(`active: ${meta.is_active}`);
  return parts.join(" · ") || "No additional details";
}

function getStockDescription(meta: Record<string, any>): string {
  const parts: string[] = [];
  if (meta.product_name) parts.push(`product: ${meta.product_name}`);
  if (meta.quantity) parts.push(`qty: ${meta.quantity}`);
  if (meta.source_warehouse_name && meta.destination_warehouse_name) {
    parts.push(`from ${meta.source_warehouse_name} → ${meta.destination_warehouse_name}`);
  }
  return parts.join(" · ") || "Stock transferred";
}

export function parseAuditLog(log: AuditLog): ParsedAuditLog {
  const meta = log.metadata || {};
  let description = "";

  if (log.action.startsWith("bill.")) {
    description = getBillDescription(meta);
  } else if (log.action.startsWith("payment.")) {
    description = getPaymentDescription(meta);
  } else if (log.action.startsWith("printable_invoice.")) {
    description = getInvoiceDescription(meta);
  } else if (log.action.startsWith("user.")) {
    description = getUserDescription(meta);
  } else if (log.action.startsWith("stock.")) {
    description = getStockDescription(meta);
  } else if (log.action === "auth.login.success") {
    description = meta.role ? `as ${meta.role.toUpperCase()}` : "";
  } else if (log.action === "bill.imported") {
    description = getBillDescription(meta);
  } else {
    // fallback: show first 2 key-value pairs from metadata
    const entries = Object.entries(meta).slice(0, 2);
    description = entries.map(([k, v]) => `${k}: ${v}`).join(", ");
  }

  return {
    id: log.id,
    timestamp: formatDate(log.created_at),
    actor: log.actor_name || "System",
    action: formatAction(log.action),
    entity: formatEntity(log.entity_type),
    description: description || "—",
    ipAddress: log.ip_address,
    rawMetadata: meta,
  };
}