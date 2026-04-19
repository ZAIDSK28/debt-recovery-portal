import { memo } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableWrapper, TBody, TD, TH, THead } from "@/components/ui/table";
import { BillStatusBadge } from "@/components/common/status-badge";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { formatCurrency, formatDate, overdueSeverity } from "@/lib/utils";
import { AssignAgentSelect } from "@/components/bills/assign-agent-select";
import type { Invoice, User } from "@/types";

const MobileBillCard = memo(function MobileBillCard({
  bill,
  users,
  onEdit,
  onDelete,
}: {
  bill: Invoice;
  users: User[];
  onEdit: (bill: Invoice) => void;
  onDelete: (bill: Invoice) => void;
}) {
  const severity = overdueSeverity(bill.overdue_days);
  const overdueClass =
    severity === "high"
      ? "text-red-600"
      : severity === "medium"
        ? "text-amber-600"
        : "text-slate-700";

  return (
    <div className="rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fcff)] p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Invoice</p>
          <p className="truncate text-[15px] font-semibold text-slate-900">{bill.invoice_number}</p>
          <p className="mt-1 text-sm text-slate-500">Bill ID #{bill.id}</p>
        </div>
        <BillStatusBadge status={bill.status} />
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] text-slate-500">Invoice Date</p>
          <p className="text-sm font-medium text-slate-900">{formatDate(bill.invoice_date)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Created On</p>
          <p className="text-sm font-medium text-slate-900">{formatDate(bill.created_at)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Route</p>
          <p className="text-sm font-medium text-slate-900">{bill.route_name}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Outlet</p>
          <p className="text-sm font-medium text-slate-900">{bill.outlet_name}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Brand</p>
          <p className="text-sm font-medium text-slate-900">{bill.brand}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Overdue Days</p>
          <p className={`text-sm font-semibold ${overdueClass}`}>{bill.overdue_days}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Total Amount</p>
          <p className="text-sm font-medium text-slate-900">{formatCurrency(bill.actual_amount)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Remaining Amount</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(bill.remaining_amount)}</p>
        </div>
      </div>

      <div className="mt-3.5">
        <p className="mb-2 text-[11px] font-medium text-slate-500">Assigned To</p>
        <AssignAgentSelect
          billId={bill.id}
          users={users}
          currentAssignedToId={bill.assigned_to_id ?? null}
        />
      </div>

      <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => onEdit(bill)}>
          <Edit3 className="mr-1 h-3.5 w-3.5" />
          Edit
        </Button>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => onDelete(bill)}>
          <Trash2 className="mr-1 h-3.5 w-3.5 text-red-500" />
          Delete
        </Button>
      </div>
    </div>
  );
});

const DesktopBillRow = memo(function DesktopBillRow({
  bill,
  users,
  onEdit,
  onDelete,
}: {
  bill: Invoice;
  users: User[];
  onEdit: (bill: Invoice) => void;
  onDelete: (bill: Invoice) => void;
}) {
  const severity = overdueSeverity(bill.overdue_days);
  const overdueClass =
    severity === "high"
      ? "text-red-600"
      : severity === "medium"
        ? "text-amber-600"
        : "text-slate-700";

  return (
    <tr className="border-t border-slate-100 transition-colors duration-150 hover:bg-sky-50/80">
      <TD>{bill.id}</TD>
      <TD className="font-medium text-slate-900">{bill.invoice_number}</TD>
      <TD>{formatDate(bill.invoice_date)}</TD>
      <TD>{bill.route_name}</TD>
      <TD>{bill.outlet_name}</TD>
      <TD>{bill.brand}</TD>
      <TD>{formatCurrency(bill.actual_amount)}</TD>
      <TD className="font-semibold">{formatCurrency(bill.remaining_amount)}</TD>
      <TD className={overdueClass}>{bill.overdue_days}</TD>
      <TD>{formatDate(bill.created_at)}</TD>
      <TD>
        <AssignAgentSelect
          billId={bill.id}
          users={users}
          currentAssignedToId={bill.assigned_to_id ?? null}
        />
      </TD>
      <TD>
        <BillStatusBadge status={bill.status} />
      </TD>
      <TD>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(bill)}>
            <Edit3 className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(bill)}>
            <Trash2 className="mr-1 h-3.5 w-3.5 text-red-500" />
            Delete
          </Button>
        </div>
      </TD>
    </tr>
  );
});

export function BillsTable({
  data,
  total,
  page,
  pageSize,
  users,
  onPageChange,
  onEdit,
  onDelete,
}: {
  data: Invoice[];
  total: number;
  page: number;
  pageSize: number;
  users: User[];
  onPageChange: (page: number) => void;
  onEdit: (bill: Invoice) => void;
  onDelete: (bill: Invoice) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
      <div className="space-y-3 p-3.5 lg:hidden">
        {data.map((bill) => (
          <MobileBillCard
            key={bill.id}
            bill={bill}
            users={users}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className="hidden lg:block">
        <TableWrapper className="rounded-none border-0 shadow-none">
          <Table className="min-w-[1200px]">
            <THead>
              <tr>
                <TH>Bill ID</TH>
                <TH>Invoice Number</TH>
                <TH>Invoice Date</TH>
                <TH>Route Name</TH>
                <TH>Outlet Name</TH>
                <TH>Brand</TH>
                <TH>Total Amount</TH>
                <TH>Remaining Amount</TH>
                <TH>Overdue Days</TH>
                <TH>Created On</TH>
                <TH>Assigned To</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {data.map((bill) => (
                <DesktopBillRow
                  key={bill.id}
                  bill={bill}
                  users={users}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </TBody>
          </Table>
        </TableWrapper>
      </div>

      <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
    </div>
  );
}