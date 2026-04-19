import { memo } from "react";
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

const MobilePaymentCard = memo(function MobilePaymentCard({
  payment,
  editableStatus,
}: {
  payment: Payment;
  editableStatus: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fcff)] p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Payment</p>
          <p className="truncate text-[15px] font-semibold text-slate-900">{payment.bill_invoice_number}</p>
          <p className="mt-1 text-sm text-slate-500">ID #{payment.id}</p>
        </div>
        <div>
          {editableStatus ? (
            <ChequeStatusSelect paymentId={payment.id} value={payment.cheque_status} />
          ) : (
            <ChequeStatusBadge status={payment.cheque_status} />
          )}
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] text-slate-500">DRA</p>
          <p className="text-sm font-medium text-slate-900">{payment.dra_username}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Method</p>
          <p className="text-sm font-medium capitalize text-slate-900">{payment.payment_method}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Amount</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Created</p>
          <p className="text-sm font-medium text-slate-900">{formatDate(payment.created_at)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Transaction No.</p>
          <p className="text-sm font-medium text-slate-900">{payment.transaction_number || "—"}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Cheque No.</p>
          <p className="text-sm font-medium text-slate-900">{payment.cheque_number || "—"}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Cheque Date</p>
          <p className="text-sm font-medium text-slate-900">{formatDate(payment.cheque_date)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Cheque Type</p>
          <p className="text-sm font-medium text-slate-900">{payment.cheque_type || "—"}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Firm</p>
          <p className="text-sm font-medium text-slate-900">{payment.firm}</p>
        </div>
      </div>
    </div>
  );
});

const DesktopPaymentRow = memo(function DesktopPaymentRow({
  payment,
  editableStatus,
}: {
  payment: Payment;
  editableStatus: boolean;
}) {
  return (
    <tr className="border-t border-slate-100 transition-colors duration-150 hover:bg-sky-50/80">
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
  );
});

export function PaymentsTable({
  data,
  total,
  page,
  pageSize,
  onPageChange,
  editableStatus = false,
}: PaymentsTableProps) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
      <div className="space-y-3 p-3.5 lg:hidden">
        {data.map((payment) => (
          <MobilePaymentCard
            key={payment.id}
            payment={payment}
            editableStatus={editableStatus}
          />
        ))}
      </div>

      <div className="hidden lg:block">
        <TableWrapper className="rounded-none border-0 shadow-none">
          <Table className="min-w-[1200px]">
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
                <DesktopPaymentRow
                  key={payment.id}
                  payment={payment}
                  editableStatus={editableStatus}
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