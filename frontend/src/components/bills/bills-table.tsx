// src/components/bills/bills-table.tsx
import type { ReactNode } from "react";
import { memo } from "react";
import { Edit3, FileSpreadsheet, Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { BillStatusBadge } from "@/components/common/status-badge";
import { AssignAgentSelect } from "@/components/bills/assign-agent-select";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, overdueSeverity } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Invoice, User } from "@/types";

// ─── Mobile card (compact palette update) ────────────────────────────────────

const MobileBillCard = memo(function MobileBillCard({
  bill, users, onEdit, onDelete,
}: { bill: Invoice; users: User[]; onEdit: (b: Invoice) => void; onDelete: (b: Invoice) => void }) {
  const s = overdueSeverity(bill.overdue_days);
  const overdueClass = s === "high" ? "text-[#E04E6A]" : s === "medium" ? "text-[#D97B0A]" : "text-[#1E1E30]";

  return (
    <div className="rounded-[14px] border border-[#DFE1F0] bg-white p-3 shadow-[0_1px_6px_rgba(30,30,48,0.05)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9898B4]">Invoice</p>
          <p className="truncate text-[14px] font-semibold text-[#1E1E30]">{bill.invoice_number}</p>
          <p className="text-[11px] text-[#9898B4]">Bill #{bill.id}</p>
        </div>
        <BillStatusBadge status={bill.status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {([
          ["Date", formatDate(bill.invoice_date)],
          ["Route", bill.route_name],
          ["Outlet", bill.outlet_name],
          ["Brand", bill.brand],
          ["Total", formatCurrency(bill.actual_amount)],
          ["Remaining", formatCurrency(bill.remaining_amount)],
        ] as [string, string][]).map(([lbl, val]) => (
          <div key={lbl}>
            <p className="text-[10px] text-[#9898B4]">{lbl}</p>
            <p className="text-[12px] font-medium text-[#1E1E30]">{val}</p>
          </div>
        ))}
        <div>
          <p className="text-[10px] text-[#9898B4]">Overdue</p>
          <p className={cn("text-[12px] font-semibold", overdueClass)}>{bill.overdue_days}d</p>
        </div>
      </div>
      <div className="mt-2.5">
        <p className="mb-1 text-[10px] text-[#9898B4]">Assigned To</p>
        <AssignAgentSelect billId={bill.id} users={users} currentAssignedToId={bill.assigned_to_id ?? null} />
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(bill)}>
          <Edit3 className="mr-1 h-3 w-3" /> Edit
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onDelete(bill)}>
          <Trash2 className="mr-1 h-3 w-3 text-[#E04E6A]" /> Delete
        </Button>
      </div>
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

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

export function BillsTable({
  data, total, page, pageSize, ordering, isLoading, isFetching,
  users, onPageChange, onSortChange, onEdit, onDelete, filters,
}: BillsTableProps) {
  const columns: DataTableColumn<Invoice>[] = [
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
      render: (r) => <span className="font-mono text-[12px] font-semibold text-[#6F72BE]">{r.invoice_number}</span>,
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
      render: (r) => <span className="font-semibold tabular-nums">{formatCurrency(r.remaining_amount)}</span>,
    },
    {
      key: "overdue_days",
      header: "Overdue",
      sortKey: "overdue_days",
      render: (r) => {
        const s = overdueSeverity(r.overdue_days);
        return (
          <span className={cn("font-semibold", s === "high" ? "text-[#E04E6A]" : s === "medium" ? "text-[#D97B0A]" : "text-[#1E1E30]")}>
            {r.overdue_days}d
          </span>
        );
      },
    },
    {
      key: "assigned_to",
      header: "Assigned To",
      render: (r) => (
        <AssignAgentSelect billId={r.id} users={users} currentAssignedToId={r.assigned_to_id ?? null} />
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
  ];

  return (
    <>
      {/* Mobile */}
      {!isLoading && data.length > 0 ? (
        <div className="space-y-2.5 lg:hidden">
          {data.map((bill) => (
            <MobileBillCard key={bill.id} bill={bill} users={users} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      ) : null}

      {/* Desktop */}
      <div className={data.length > 0 && !isLoading ? "hidden lg:block" : "block"}>
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
    </>
  );
}