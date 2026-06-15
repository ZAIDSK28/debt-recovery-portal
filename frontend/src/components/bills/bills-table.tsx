// src/components/bills/bills-table.tsx
import type { ReactNode } from "react";
import { memo, useCallback, useMemo } from "react";
import { Edit3, FileSpreadsheet, Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { BillStatusBadge } from "@/components/common/status-badge";
import { AssignAgentSelect } from "@/components/bills/assign-agent-select";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, overdueSeverity } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Invoice, User } from "@/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface BillsTableProps {
  data: Invoice[];
  total: number;
  page: number;
  pageSize: number;
  ordering?: string;
  isLoading: boolean;
  isFetching?: boolean;
  users: User[];
  onPageChange: (page: number) => void;
  onSortChange: (ordering: string | undefined) => void;
  onEdit: (bill: Invoice) => void;
  onDelete: (bill: Invoice) => void;
  filters?: ReactNode;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export const BillsTable = memo(function BillsTable({
  data,
  total,
  page,
  pageSize,
  ordering,
  isLoading,
  isFetching,
  users,
  onPageChange,
  onSortChange,
  onEdit,
  onDelete,
  filters,
}: BillsTableProps) {
  const columns = useMemo<DataTableColumn<Invoice>[]>(() => [
    {
      key: "id",
      header: "ID",
      sortKey: "id",
      render: (r) => <span className="tabular-nums text-[#9898B4]">#{r.id}</span>,
    },
    {
      key: "invoice_number",
      header: "Invoice No.",
      sortKey: "invoice_number",
      render: (r) => (
        <span className="font-mono text-[12px] font-semibold text-[#6F72BE]">
          {r.invoice_number}
        </span>
      ),
    },
    {
      key: "invoice_date",
      header: "Date",
      sortKey: "invoice_date",
      render: (r) => <span className="text-[#9898B4]">{formatDate(r.invoice_date)}</span>,
    },
    { key: "route_name", header: "Route", sortKey: "route_name" },
    {
      key: "outlet_name",
      header: "Outlet",
      sortKey: "outlet_name",
      cellClassName: "max-w-[130px] truncate",
    },
    { key: "brand", header: "Brand" },
    {
      key: "actual_amount",
      header: "Total",
      sortKey: "actual_amount",
      render: (r) => <span className="tabular-nums">{formatCurrency(r.actual_amount)}</span>,
    },
    {
      key: "remaining_amount",
      header: "Remaining",
      sortKey: "remaining_amount",
      render: (r) => (
        <span className="font-semibold tabular-nums">{formatCurrency(r.remaining_amount)}</span>
      ),
    },
    {
      key: "overdue_days",
      header: "Overdue",
      sortKey: "overdue_days",
      render: (r) => {
        const s = overdueSeverity(r.overdue_days);
        return (
          <span
            className={cn(
              "font-semibold",
              s === "high"
                ? "text-[#E04E6A]"
                : s === "medium"
                  ? "text-[#D97B0A]"
                  : "text-[#1E1E30]",
            )}
          >
            {r.overdue_days}d
          </span>
        );
      },
    },
    {
      key: "assigned_to",
      header: "Assigned To",
      render: (r) => (
        <AssignAgentSelect
          billId={r.id}
          users={users}
          currentAssignedToId={r.assigned_to_id ?? null}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <BillStatusBadge status={r.status} />,
    },
    {
      key: "created_at",
      header: "Created",
      sortKey: "created_at",
      render: (r) => <span className="text-[#9898B4]">{formatDate(r.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-[68px]",
      cellClassName: "w-[68px]",
      render: (r) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(r)}>
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            onClick={() => onDelete(r)}
            className="text-[#9898B4] hover:bg-[#FDEEF1] hover:text-[#E04E6A]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ], [users, onEdit, onDelete]);

  const showEmpty = !isLoading && data.length === 0;

  return (
    <div className="w-full overflow-x-auto">
      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        ordering={ordering}
        isLoading={isLoading}
        isFetching={isFetching}
        onPageChange={onPageChange}
        onSortChange={onSortChange}
        rowKey={(r) => r.id}
        minWidth={1280}
        filters={filters}
        emptyState={
          <EmptyState
            icon={<FileSpreadsheet className="h-5 w-5" />}
            title="No bills found"
            description="Create a new bill or adjust your search."
          />
        }
      />
    </div>
  );
});