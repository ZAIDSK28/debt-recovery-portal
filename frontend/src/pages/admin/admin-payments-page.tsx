// src/pages/admin/admin-payments-page.tsx
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/lib/toast";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { PaymentsTable } from "@/components/payments/payments-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePayments } from "@/hooks/usePayments";
import { useDebounce } from "@/hooks/useDebounce";
import { exportPaymentsApi, exportPaymentsWithMetaApi } from "@/api/payments.api";
import { ExportWithDateRange } from "@/components/common/export-with-date-range";
import { DateRangeFilter } from "@/components/common/date-range-filter";
import { cn } from "@/lib/utils";

type PaymentTab = "cash" | "cheques" | "electronic";
const TABS: { id: PaymentTab; label: string }[] = [
  { id: "cash", label: "Cash & UPI" },
  { id: "cheques", label: "Cheques" },
  { id: "electronic", label: "Electronic" },
];

function TabPanel({ tab }: { tab: PaymentTab }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [chequeStatus, setChequeStatus] = useState("all");
  const [ordering, setOrdering] = useState<string | undefined>("-created_at");
  const debouncedSearch = useDebounce(search, 400);

  const isCashUpi = tab === "cash";
  const isCheque = tab === "cheques";
  const isElectronic = tab === "electronic";

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      ...(isCashUpi
        ? { payment_method_in: "cash,upi" }
        : { payment_method: (isCheque ? "cheque" : "electronic") as "cheque" | "electronic" }),
      search: debouncedSearch || undefined,
      start_date: filterStartDate || undefined,
      end_date: filterEndDate || undefined,
      cheque_status: !isCashUpi && chequeStatus !== "all" ? (chequeStatus as any) : undefined,
      ordering,
    }),
    [page, pageSize, isCashUpi, isCheque, debouncedSearch, filterStartDate, filterEndDate, chequeStatus, ordering]
  );

  const query = usePayments(params);

  const handleSortChange = useCallback((ord: string | undefined) => {
    setOrdering(ord);
    setPage(1);
  }, []);

  function resetFilters() {
    setSearch("");
    setFilterStartDate("");
    setFilterEndDate("");
    setChequeStatus("all");
    setPage(1);
  }

  const isDirty = Boolean(search || filterStartDate || filterEndDate || (!isCashUpi && chequeStatus !== "all"));

  const emptyTitles: Record<PaymentTab, string> = {
    cash: "No cash or UPI payments found",
    cheques: "No cheque records found",
    electronic: "No electronic records found",
  };
  const emptyDescriptions: Record<PaymentTab, string> = {
    cash: "No completed cash or UPI payments match the selected range.",
    cheques: "Cheque payments will appear here once recorded.",
    electronic: "Electronic payment entries will appear here once recorded.",
  };

  const exportFn = useCallback(
    async (params: { start_date?: string; end_date?: string }) => {
      if (isCashUpi) {
        return exportPaymentsWithMetaApi({
          payment_method_in: "cash,upi",
          start_date: params.start_date,
          end_date: params.end_date,
        }).then(({ blob }) => blob);
      }
      return exportPaymentsApi({
        payment_method: isCheque ? "cheque" : "electronic",
        start_date: params.start_date,
        end_date: params.end_date,
      });
    },
    [isCashUpi, isCheque]
  );

  const defaultFilename = isCashUpi
    ? "payments_cash_upi.xlsx"
    : isCheque
      ? "cheque_history.xlsx"
      : "electronic_history.xlsx";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportWithDateRange
          exportFn={exportFn}
          defaultFilename={defaultFilename}
          buttonVariant="outline"
          buttonText="Export XLSX"
        />
      </div>

      <PaymentsTable
        data={query.data?.results ?? []}
        total={query.data?.count ?? 0}
        page={page}
        pageSize={pageSize}
        ordering={ordering}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        onPageChange={setPage}
        onSortChange={handleSortChange}
        editableStatus={!isCashUpi}
        showChequeColumns={!isCashUpi}
        showStatusColumn={!isCashUpi}
        emptyTitle={emptyTitles[tab]}
        emptyDescription={emptyDescriptions[tab]}
        filters={
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[180px] flex-1">
              <SearchInput
                placeholder="Search invoice or DRA…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {!isCashUpi && (
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] text-[#9898B4]">Status</Label>
                <Select
                  value={chequeStatus}
                  onValueChange={(v) => {
                    setChequeStatus(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[128px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DateRangeFilter
              startDate={filterStartDate}
              endDate={filterEndDate}
              onStartDateChange={(v) => { setFilterStartDate(v); setPage(1); }}
              onEndDateChange={(v) => { setFilterEndDate(v); setPage(1); }}
              onClear={() => { setFilterStartDate(""); setFilterEndDate(""); setPage(1); }}
            />
            {isDirty && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear all
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") as PaymentTab | null;
  const activeTab: PaymentTab = rawTab && TABS.some((t) => t.id === rawTab) ? rawTab : "cash";

  return (
    <AppShell title="Payments">
      <div className="space-y-4">
        <PageHeader title="Payments" description="Review and manage all payment activity by method." />
        <div className="flex w-fit gap-0.5 rounded-[10px] border border-[#DFE1F0] bg-[#F6F7FC] p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSearchParams({ tab: tab.id }, { replace: true })}
              className={cn(
                "rounded-[8px] px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                activeTab === tab.id
                  ? "bg-white text-[#6F72BE] shadow-[0_1px_4px_rgba(30,30,48,0.08)]"
                  : "text-[#9898B4] hover:text-[#6F72BE]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <TabPanel key={activeTab} tab={activeTab} />
      </div>
    </AppShell>
  );
}