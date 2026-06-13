// src/pages/admin/admin-electronic-page.tsx
import { useCallback, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "@/lib/toast";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { PaymentsTable } from "@/components/payments/payments-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePayments } from "@/hooks/usePayments";
import { useDebounce } from "@/hooks/useDebounce";
import { exportPaymentsApi } from "@/api/payments.api";
import { downloadBlob, getApiError } from "@/lib/utils";

export default function AdminElectronicPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chequeStatus, setChequeStatus] = useState("all");
  const [ordering, setOrdering] = useState<string | undefined>("-created_at");
  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      payment_method: "electronic" as const,
      search: debouncedSearch || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      cheque_status: chequeStatus !== "all" ? chequeStatus : undefined,
      ordering,
    }),
    [page, pageSize, debouncedSearch, startDate, endDate, chequeStatus, ordering],
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
    setChequeStatus("all");
    setPage(1);
  }

  const isDirty = search || startDate || endDate || chequeStatus !== "all";

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
      const blob = await exportPaymentsApi({
        payment_method: "electronic",
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      downloadBlob(blob, "electronic_history.xlsx");
      toast.success("Export started");
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <AppShell title="Electronic History">
      <div className="space-y-4">
        <PageHeader
          title="Electronic History"
          description="Track electronic submissions and update clearance status."
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
          editableStatus
          showChequeColumns
          showStatusColumn
          emptyTitle="No electronic records"
          emptyDescription="Electronic payment entries will appear here once recorded."
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
                <Label className="text-[10px] text-[#9898B4]">Status</Label>
                <Select
                  value={chequeStatus}
                  onValueChange={(v) => { setChequeStatus(v); setPage(1); }}
                >
                  <SelectTrigger className="h-8 w-[120px] text-[12px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>
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

              {isDirty ? (
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