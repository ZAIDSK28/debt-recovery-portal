import { useMemo, useState } from "react";
import { BadgeIndianRupee, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableWrapper, TBody, TD, TH, THead } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentFormModal } from "@/components/payments/payment-form-modal";
import { useDebounce } from "@/hooks/useDebounce";
import { useMyAssignments } from "@/hooks/useBills";
import { formatCurrency, formatDate, overdueSeverity } from "@/lib/utils";
import type { Invoice } from "@/types";

export default function DRADashboardPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"invoice_number" | "route_name" | "outlet_name">("invoice_number");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedBill, setSelectedBill] = useState<Invoice | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const query = useMyAssignments({
    page,
    page_size: pageSize,
    search: debouncedSearch,
    mode,
    ordering: "-invoice_date",
  });

  const bills = query.data?.results ?? [];

  const metrics = useMemo(() => {
    const totalBills = query.data?.count ?? 0;
    const outstandingAmount = bills.reduce((sum, bill) => sum + Number(bill.remaining_amount), 0);

    return {
      totalBills,
      outstandingAmount,
    };
  }, [query.data?.count, bills]);

  return (
    <AppShell title="DRA Dashboard">
      <div className="space-y-6">
        <PageHeader
          title="Assigned Invoices"
          description="Search your active assignments and record collections from the field."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <KpiCard
            title="Total Bills Assigned"
            value={String(metrics.totalBills)}
            icon={FileText}
            accentClassName="bg-indigo-500"
          />
          <KpiCard
            title="Outstanding Amount"
            value={formatCurrency(metrics.outstandingAmount)}
            icon={BadgeIndianRupee}
            accentClassName="bg-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
          <SearchInput
            placeholder="Search assigned bills..."
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
          />

          <Select value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
            <SelectTrigger>
              <SelectValue placeholder="Search mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice_number">Invoice Number</SelectItem>
              <SelectItem value="route_name">Route Name</SelectItem>
              <SelectItem value="outlet_name">Outlet Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : bills.length === 0 ? (
          <EmptyState
            title="No assigned invoices"
            description="There are currently no open invoices assigned to you."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <TableWrapper className="rounded-none border-0">
              <Table>
                <THead>
                  <tr>
                    <TH>Invoice Number</TH>
                    <TH>Invoice Date</TH>
                    <TH>Route Name</TH>
                    <TH>Outlet Name</TH>
                    <TH>Brand</TH>
                    <TH>Total Amount</TH>
                    <TH>Remaining Amount</TH>
                    <TH>Overdue Days</TH>
                    <TH className="text-right">Action</TH>
                  </tr>
                </THead>
                <TBody>
                  {bills.map((bill) => {
                    const severity = overdueSeverity(bill.overdue_days);
                    const overdueClass =
                      severity === "high"
                        ? "text-red-600"
                        : severity === "medium"
                          ? "text-amber-600"
                          : "text-slate-700";

                    return (
                      <tr key={bill.id} className="border-t border-slate-100 transition-colors hover:bg-indigo-50/40">
                        <TD className="font-medium text-slate-900">{bill.invoice_number}</TD>
                        <TD>{formatDate(bill.invoice_date)}</TD>
                        <TD>{bill.route_name}</TD>
                        <TD>{bill.outlet_name}</TD>
                        <TD>{bill.brand}</TD>
                        <TD>{formatCurrency(bill.actual_amount)}</TD>
                        <TD className="font-semibold">{formatCurrency(bill.remaining_amount)}</TD>
                        <TD className={overdueClass}>{bill.overdue_days}</TD>
                        <TD>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedBill(bill);
                                setIsPaymentOpen(true);
                              }}
                            >
                              Record Payment
                            </Button>
                          </div>
                        </TD>
                      </tr>
                    );
                  })}
                </TBody>
              </Table>
            </TableWrapper>

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-500">
                Page {page} · {query.data?.count ?? 0} records
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil((query.data?.count ?? 0) / pageSize)}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PaymentFormModal
        open={isPaymentOpen}
        onOpenChange={(open) => {
          setIsPaymentOpen(open);
          if (!open) {
            setSelectedBill(null);
          }
        }}
        bill={selectedBill}
        onBillCleared={() => {
          // intentionally no tile update since KPI removed
        }}
      />
    </AppShell>
  );
}