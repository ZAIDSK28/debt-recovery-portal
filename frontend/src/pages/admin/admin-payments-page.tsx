// src/pages/admin/admin-payments-page.tsx
import { useCallback, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { PaymentsTable } from "@/components/payments/payments-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { usePayments } from "@/hooks/usePayments";
import { useDebounce } from "@/hooks/useDebounce";
import { exportPaymentsWithMetaApi } from "@/api/payments.api";
import { downloadBlob, getApiError } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ordering, setOrdering] = useState<string | undefined>("-created_at");
  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      payment_method_in: "cash,upi",
      search: debouncedSearch || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      ordering,
    }),
    [page, pageSize, debouncedSearch, startDate, endDate, ordering],
  );

  const query = usePayments(params);

  const handleSortChange = useCallback((ord: string | undefined) => {
    setOrdering(ord);
    setPage(1);
  }, []);

  function reset() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  async function handleExport() {
    if (startDate && endDate && startDate > endDate) {
      toast.error("Start date cannot be after end date.");
      return;
    }
    if ((query.data?.count ?? 0) === 0) {
      toast.info("No records to export.");
      return;
    }
    try {
      const { blob, filename } = await exportPaymentsWithMetaApi({
        payment_method_in: "cash,upi",
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      downloadBlob(blob, filename || "payments_history.xlsx");
      toast.success("Export started");
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <AppShell title="Payments">
      <div className="space-y-4">
        <PageHeader
          title="Payment History"
          description="Review completed cash and UPI payment activity."
          actions={
            <Button variant="outline" onClick={() => void handleExport()}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export XLSX
            </Button>
          }
        />

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
          showChequeColumns={false}
          showStatusColumn={false}
          emptyTitle="No payments found"
          emptyDescription="No completed cash or UPI payments match the selected range."
          filters={
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[180px] flex-1">
                <SearchInput
                  placeholder="Search invoice or DRA…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] text-[#9898B4]">From</Label>
                <DateInput
                  value={startDate}
                  onChange={(v) => { setStartDate(v); setPage(1); }}
                  clearable
                  max={endDate || undefined}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] text-[#9898B4]">To</Label>
                <DateInput
                  value={endDate}
                  onChange={(v) => { setEndDate(v); setPage(1); }}
                  clearable
                  min={startDate || undefined}
                />
              </div>
              {(search || startDate || endDate) ? (
                <Button variant="ghost" size="sm" onClick={reset}>
                  Clear
                </Button>
              ) : null}
            </div>
          }
        />
      </div>
    </AppShell>
  );
}