// src/pages/dra/dra-dashboard-page.tsx
import { useCallback, useMemo, useState } from "react";
import { BadgeIndianRupee, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { SearchInput } from "@/components/common/search-input";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { PaymentFormModal } from "@/components/payments/payment-form-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { useMyAssignments } from "@/hooks/useBills";
import { cn, formatCurrency, formatDate, overdueSeverity } from "@/lib/utils";
import type { Invoice } from "@/types";

export default function DRADashboardPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"invoice_number" | "route_name" | "outlet_name">("invoice_number");
  const [ordering, setOrdering] = useState<string | undefined>("-invoice_date");
  const [selectedBill, setSelectedBill] = useState<Invoice | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const assignmentParams = useMemo(
    () => ({ page, page_size: pageSize, search: debouncedSearch, mode, ordering }),
    [page, pageSize, debouncedSearch, mode, ordering],
  );

  const query = useMyAssignments(assignmentParams);
  const bills = query.data?.results ?? [];

  const totalOutstanding = useMemo(
    () => bills.reduce((s, b) => s + Number(b.remaining_amount), 0),
    [bills],
  );

  const openPayment = useCallback((bill: Invoice) => {
    setSelectedBill(bill);
    setIsPaymentOpen(true);
  }, []);

  const handleSortChange = useCallback((ord: string | undefined) => {
    setOrdering(ord);
    setPage(1);
  }, []);

  const overdueCellClass = (days: number) => {
    const s = overdueSeverity(days);
    return s === "high" ? "text-[#E04E6A]" : s === "medium" ? "text-[#D97B0A]" : "text-[#1E1E30]";
  };

  const columns: DataTableColumn<Invoice>[] = [
    {
      key: "invoice_number",
      header: "Invoice No.",
      sortKey: "invoice_number",
      render: (r) => <span className="font-medium text-[#1E1E30]">{r.invoice_number}</span>,
    },
    {
      key: "invoice_date",
      header: "Invoice Date",
      sortKey: "invoice_date",
      render: (r) => <span className="text-[12px] text-[#9898B4]">{formatDate(r.invoice_date)}</span>,
    },
    { key: "route_name", header: "Route", sortKey: "route_name" },
    { key: "outlet_name", header: "Outlet", sortKey: "outlet_name" },
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
      render: (r) => (
        <span className={cn("font-semibold", overdueCellClass(r.overdue_days))}>
          {r.overdue_days}d
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (r) => (
        <Button size="sm" onClick={() => openPayment(r)}>
          Record Payment
        </Button>
      ),
    },
  ];

  return (
    <AppShell title="DRA Dashboard">
      <div className="space-y-5">
        <PageHeader
          title="Assigned Invoices"
          description="Search your active assignments and record collections from the field."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <KpiCard
            title="Bills Assigned"
            value={String(query.data?.count ?? 0)}
            icon={FileText}
            accentClassName="bg-[#6F72BE]"
          />
          <KpiCard
            title="Outstanding"
            value={formatCurrency(totalOutstanding)}
            icon={BadgeIndianRupee}
            accentClassName="bg-[#D97B0A]"
          />
        </div>

        {/* Mobile cards */}
        {!query.isLoading && bills.length > 0 ? (
          <div className="space-y-3 lg:hidden">
            {bills.map((bill) => {
              const s = overdueSeverity(bill.overdue_days);
              const cls = s === "high" ? "text-[#E04E6A]" : s === "medium" ? "text-[#D97B0A]" : "text-[#1E1E30]";
              return (
                <div key={bill.id} className="rounded-[18px] border border-[#DFE1F0] bg-white p-3.5 shadow-[0_2px_8px_rgba(30,30,48,0.06)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9898B4]">Invoice</p>
                  <p className="text-[15px] font-semibold text-[#1E1E30]">{bill.invoice_number}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    {[
                      ["Date", formatDate(bill.invoice_date)],
                      ["Route", bill.route_name],
                      ["Outlet", bill.outlet_name],
                      ["Brand", bill.brand],
                      ["Total", formatCurrency(bill.actual_amount)],
                      ["Remaining", formatCurrency(bill.remaining_amount)],
                    ].map(([lbl, val]) => (
                      <div key={String(lbl)}>
                        <p className="text-[11px] text-[#9898B4]">{lbl}</p>
                        <p className="text-[13px] font-medium text-[#1E1E30]">{val}</p>
                      </div>
                    ))}
                    <div>
                      <p className="text-[11px] text-[#9898B4]">Overdue</p>
                      <p className={cn("text-[13px] font-semibold", cls)}>{bill.overdue_days}d</p>
                    </div>
                  </div>

                  <Button className="mt-3 w-full" size="sm" onClick={() => openPayment(bill)}>
                    Record Payment
                  </Button>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Desktop DataTable */}
        <div className={bills.length > 0 && !query.isLoading ? "hidden lg:block" : "block"}>
          <DataTable
            columns={columns}
            data={bills}
            total={query.data?.count ?? 0}
            page={page}
            pageSize={pageSize}
            ordering={ordering}
            isLoading={query.isLoading}
            isFetching={query.isFetching}
            onPageChange={setPage}
            onSortChange={handleSortChange}
            rowKey={(r) => r.id}
            minWidth={920}
            filters={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Search assigned bills…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
                <div className="w-full sm:w-52">
                  <Select value={mode} onValueChange={(v) => { setMode(v as typeof mode); setPage(1); }}>
                    <SelectTrigger><SelectValue placeholder="Search mode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice_number">Invoice Number</SelectItem>
                      <SelectItem value="route_name">Route Name</SelectItem>
                      <SelectItem value="outlet_name">Outlet Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
            emptyState={
              <EmptyState
                icon={<FileText className="h-6 w-6" />}
                title="No assigned invoices"
                description="There are currently no open invoices assigned to you."
              />
            }
          />
        </div>
      </div>

      <PaymentFormModal
        open={isPaymentOpen}
        onOpenChange={(open) => { setIsPaymentOpen(open); if (!open) setSelectedBill(null); }}
        bill={selectedBill}
        onBillCleared={() => {}}
      />
    </AppShell>
  );
}