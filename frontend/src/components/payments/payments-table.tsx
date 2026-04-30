// src/components/payments/payments-table.tsx
import { memo } from "react";
import { Table, TableWrapper, TBody, TD, TH, THead } from "@/components/ui/table";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { ChequeStatusBadge } from "@/components/common/status-badge";
import { ChequeStatusSelect } from "@/components/payments/cheque-status-select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  formatCurrency,
  formatDate,
  getPaymentReferenceLabel,
  getPaymentReferenceValue,
  isChequeLikePayment,
} from "@/lib/utils";
import type { Payment } from "@/types";

interface PaymentsTableProps {
  data: Payment[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  editableStatus?: boolean;
  showChequeColumns?: boolean;
  showStatusColumn?: boolean;
}

const MobilePaymentCard = memo(function MobilePaymentCard({
  payment,
  editableStatus,
  showChequeColumns,
  showStatusColumn,
}: {
  payment: Payment;
  editableStatus: boolean;
  showChequeColumns: boolean;
  showStatusColumn: boolean;
}) {
  const chequeLike = isChequeLikePayment(payment);
  const referenceLabel = getPaymentReferenceLabel(payment);
  const referenceValue = getPaymentReferenceValue(payment);

  return (
    <div className="rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fcff)] p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Payment</p>
          <p className="truncate text-[15px] font-semibold text-slate-900">{payment.bill_invoice_number}</p>
          <p className="mt-1 text-sm text-slate-500">ID #{payment.id}</p>
        </div>
        {showStatusColumn && chequeLike ? (
          <div className="shrink-0">
            {editableStatus ? (
              <ChequeStatusSelect paymentId={payment.id} value={payment.cheque_status} />
            ) : (
              <ChequeStatusBadge status={payment.cheque_status} />
            )}
          </div>
        ) : null}
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

        {showChequeColumns && referenceValue !== "—" ? (
          <div>
            <p className="text-[11px] text-slate-500">{referenceLabel}</p>
            <p className="text-sm font-medium text-slate-900">{referenceValue}</p>
          </div>
        ) : null}

        {showChequeColumns && chequeLike ? (
          <div>
            <p className="text-[11px] text-slate-500">Firm</p>
            <p className="text-sm font-medium text-slate-900">{payment.firm || "—"}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
});

const DesktopPaymentRow = memo(function DesktopPaymentRow({
  payment,
  editableStatus,
  showChequeColumns,
  showStatusColumn,
}: {
  payment: Payment;
  editableStatus: boolean;
  showChequeColumns: boolean;
  showStatusColumn: boolean;
}) {
  const chequeLike = isChequeLikePayment(payment);

  return (
    <tr className="border-t border-slate-100 transition-colors duration-150 hover:bg-sky-50/80">
      <TD>{payment.id}</TD>
      <TD className="font-medium text-slate-900">{payment.bill_invoice_number}</TD>
      <TD>{payment.dra_username}</TD>
      <TD className="capitalize">{payment.payment_method}</TD>
      <TD>{formatCurrency(payment.amount)}</TD>

      {showChequeColumns ? (
        <>
          <TD>{payment.transaction_number || "—"}</TD>
          <TD>{payment.cheque_number || "—"}</TD>
          <TD>{formatDate(payment.cheque_date)}</TD>
          <TD className="capitalize">{payment.cheque_type || "—"}</TD>
        </>
      ) : (
        <TD>{payment.transaction_number || "—"}</TD>
      )}

      {showStatusColumn ? (
        <TD>
          {chequeLike ? (
            editableStatus ? (
              <ChequeStatusSelect paymentId={payment.id} value={payment.cheque_status} />
            ) : (
              <ChequeStatusBadge status={payment.cheque_status} />
            )
          ) : (
            "—"
          )}
        </TD>
      ) : null}

      <TD>{chequeLike ? payment.firm || "—" : "—"}</TD>
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
  showChequeColumns = true,
  showStatusColumn = true,
}: PaymentsTableProps) {
  const hasRows = data.length > 0;
  const desktopMinWidth = showChequeColumns ? "w-full min-w-[1320px] table-auto" : "w-full min-w-[980px] table-auto";

  return (
    <div className="w-full overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
      {!hasRows ? (
        <div className="p-4">
          <EmptyState
            title="No payments found"
            description="Payment records will appear here when available."
          />
        </div>
      ) : (
        <>
          <div className="space-y-3 p-3.5 lg:hidden">
            {data.map((payment) => (
              <MobilePaymentCard
                key={payment.id}
                payment={payment}
                editableStatus={editableStatus}
                showChequeColumns={showChequeColumns}
                showStatusColumn={showStatusColumn}
              />
            ))}
          </div>

          <div className="hidden w-full lg:block">
            <TableWrapper className="w-full rounded-none border-0 shadow-none">
              <Table className={desktopMinWidth}>
                <THead>
                  <tr>
                    <TH>ID</TH>
                    <TH>Invoice</TH>
                    <TH>DRA</TH>
                    <TH>Method</TH>
                    <TH>Amount</TH>

                    {showChequeColumns ? (
                      <>
                        <TH>Transaction No.</TH>
                        <TH>Cheque No.</TH>
                        <TH>Cheque Date</TH>
                        <TH>Cheque Type</TH>
                      </>
                    ) : (
                      <TH>Transaction No.</TH>
                    )}

                    {showStatusColumn ? <TH>Status</TH> : null}
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
                      showChequeColumns={showChequeColumns}
                      showStatusColumn={showStatusColumn}
                    />
                  ))}
                </TBody>
              </Table>
            </TableWrapper>
          </div>
        </>
      )}

      <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
    </div>
  );
}