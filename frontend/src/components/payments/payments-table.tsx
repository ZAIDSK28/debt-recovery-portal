import { Table, TableWrapper, TBody, TD, TH, THead } from "@/components/ui/table";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { ChequeStatusBadge } from "@/components/common/status-badge";
import { ChequeStatusSelect } from "@/components/payments/cheque-status-select";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment } from "@/types";

interface PaymentsTableProps {
  data: Payment[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  editableStatus?: boolean;
}

export function PaymentsTable({
  data,
  total,
  page,
  pageSize,
  onPageChange,
  editableStatus = false,
}: PaymentsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <TableWrapper className="rounded-none border-0">
        <Table>
          <THead>
            <tr>
              <TH>ID</TH>
              <TH>Invoice</TH>
              <TH>DRA</TH>
              <TH>Method</TH>
              <TH>Amount</TH>
              <TH>Transaction No.</TH>
              <TH>Cheque No.</TH>
              <TH>Cheque Date</TH>
              <TH>Cheque Type</TH>
              <TH>Status</TH>
              <TH>Firm</TH>
              <TH>Created</TH>
            </tr>
          </THead>
          <TBody>
            {data.map((payment) => (
              <tr key={payment.id} className="border-t border-slate-100 transition-colors hover:bg-indigo-50/40">
                <TD>{payment.id}</TD>
                <TD className="font-medium text-slate-900">{payment.bill_invoice_number}</TD>
                <TD>{payment.dra_username}</TD>
                <TD className="capitalize">{payment.payment_method}</TD>
                <TD>{formatCurrency(payment.amount)}</TD>
                <TD>{payment.transaction_number || "—"}</TD>
                <TD>{payment.cheque_number || "—"}</TD>
                <TD>{formatDate(payment.cheque_date)}</TD>
                <TD>{payment.cheque_type || "—"}</TD>
                <TD>
                  {editableStatus ? (
                    <ChequeStatusSelect paymentId={payment.id} value={payment.cheque_status} />
                  ) : (
                    <ChequeStatusBadge status={payment.cheque_status} />
                  )}
                </TD>
                <TD>{payment.firm}</TD>
                <TD>{formatDate(payment.created_at)}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </TableWrapper>

      <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
    </div>
  );
}