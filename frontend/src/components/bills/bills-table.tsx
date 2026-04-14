import { Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableWrapper, TBody, TD, TH, THead } from "@/components/ui/table";
import { BillStatusBadge } from "@/components/common/status-badge";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { formatCurrency, formatDate, overdueSeverity } from "@/lib/utils";
import { AssignAgentSelect } from "@/components/bills/assign-agent-select";
import type { Invoice, User } from "@/types";

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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <TableWrapper className="rounded-none border-0">
        <Table>
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
            {data.map((bill) => {
              const severity = overdueSeverity(bill.overdue_days);
              const overdueClass =
                severity === "high"
                  ? "text-red-600"
                  : severity === "medium"
                    ? "text-amber-600"
                    : "text-slate-700";

              return (
                <tr key={bill.id} className="border-t border-slate-100 transition-colors hover:bg-indigo-50/40">
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
                        <Edit3 className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onDelete(bill)}>
                        <Trash2 className="mr-1 h-4 w-4 text-red-500" />
                        Delete
                      </Button>
                    </div>
                  </TD>
                </tr>
              );
            })}
          </TBody>
        </Table>
      </TableWrapper>

      <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
    </div>
  );
}