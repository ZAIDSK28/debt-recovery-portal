// src/components/payments/payments-table.tsx
import type { ReactNode } from "react";
import { memo } from "react";
import { Wallet } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { ChequeStatusBadge } from "@/components/common/status-badge";
import { ChequeStatusSelect } from "@/components/payments/cheque-status-select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  formatCurrency,
  formatDate,
  isChequeLikePayment,
} from "@/lib/utils";
import type { Payment } from "@/types";

interface PaymentsTableProps {
  data: Payment[];
  total: number;
  page: number;
  pageSize: number;
  ordering?: string;
  isLoading: boolean;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onSortChange: (ordering: string | undefined) => void;
  editableStatus?: boolean;
  showChequeColumns?: boolean;
  showStatusColumn?: boolean;
  filters?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const PaymentsTable = memo(function PaymentsTable({
  data,
  total,
  page,
  pageSize,
  ordering,
  isLoading,
  isFetching,
  onPageChange,
  onSortChange,
  editableStatus = false,
  showChequeColumns = true,
  showStatusColumn = true,
  filters,
  emptyTitle = "No payments found",
  emptyDescription = "Payment records will appear here when available.",
}: PaymentsTableProps) {
  const columns: DataTableColumn<Payment>[] = [
    {
      key: "id",
      header: "ID",
      sortKey: "id",
      render: (r) => <span className="tabular-nums text-[#9898B4]">#{r.id}</span>,
    },
    {
      key: "bill_invoice_number",
      header: "Invoice",
      sortKey: "bill__invoice_number",
      render: (r) => (
        <span className="font-mono text-[11.5px] font-semibold text-[#6F72BE]">
          {r.bill_invoice_number}
        </span>
      ),
    },
    {
      key: "dra_username",
      header: "DRA",
      sortKey: "dra__username",
      render: (r) => <span className="text-[#1E1E30]">{r.dra_username}</span>,
    },
    {
      key: "payment_method",
      header: "Method",
      render: (r) => (
        <span className="capitalize text-[#6B6B8A]">{r.payment_method}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sortKey: "amount",
      render: (r) => (
        <span className="font-semibold tabular-nums">{formatCurrency(r.amount)}</span>
      ),
    },

    // Cheque-specific columns
    ...(showChequeColumns
      ? ([
          {
            key: "transaction_number",
            header: "Txn No.",
            render: (r: Payment) => (
              <span className="font-mono text-[11px] text-[#6B6B8A]">
                {r.transaction_number || "—"}
              </span>
            ),
          },
          {
            key: "cheque_number",
            header: "Cheque No.",
            render: (r: Payment) => r.cheque_number || "—",
          },
          {
            key: "cheque_date",
            header: "Cheque Date",
            render: (r: Payment) =>
              r.cheque_date ? (
                <span className="text-[#9898B4]">{formatDate(r.cheque_date)}</span>
              ) : (
                "—"
              ),
          },
          {
            key: "cheque_type",
            header: "Type",
            render: (r: Payment) =>
              r.cheque_type ? (
                <span className="font-mono uppercase text-[11px]">{r.cheque_type}</span>
              ) : (
                "—"
              ),
          },
          {
            key: "firm",
            header: "Firm",
            render: (r: Payment) =>
              isChequeLikePayment(r) ? (
                <span className="text-[#6B6B8A]">{r.firm || "—"}</span>
              ) : (
                "—"
              ),
          },
        ] as DataTableColumn<Payment>[])
      : ([
          {
            key: "transaction_number",
            header: "Reference",
            render: (r: Payment) => (
              <span className="font-mono text-[11px] text-[#6B6B8A]">
                {r.transaction_number || "—"}
              </span>
            ),
          },
        ] as DataTableColumn<Payment>[])),

    // Status column
    ...(showStatusColumn
      ? ([
          {
            key: "cheque_status",
            header: "Status",
            render: (r: Payment) =>
              isChequeLikePayment(r) ? (
                editableStatus ? (
                  <ChequeStatusSelect paymentId={r.id} value={r.cheque_status} />
                ) : (
                  <ChequeStatusBadge status={r.cheque_status} />
                )
              ) : (
                "—"
              ),
          },
        ] as DataTableColumn<Payment>[])
      : []),

    {
      key: "created_at",
      header: "Created",
      sortKey: "created_at",
      render: (r) => (
        <span className="text-[12px] text-[#9898B4]">{formatDate(r.created_at)}</span>
      ),
    },
  ];

  return (
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
      minWidth={showChequeColumns ? 1180 : 860}
      filters={filters}
      emptyState={
        <EmptyState
          icon={<Wallet className="h-5 w-5" />}
          title={emptyTitle}
          description={emptyDescription}
        />
      }
    />
  );
});