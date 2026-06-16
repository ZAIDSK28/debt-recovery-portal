// src/pages/admin/admin-dashboard-page.tsx
import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { FileSpreadsheet, Plus, RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { BillsTable } from "@/components/bills/bills-table";
import { BillFormModal } from "@/components/bills/bill-form-modal";
import { ImportBillsDialog } from "@/components/bills/import-bills-dialog";
import { DeleteBillDialog } from "@/components/bills/delete-bill-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBills } from "@/hooks/useBills";
import { useDashboardDailyCollections, useRebuildDashboardDailyCollections } from "@/hooks/useDashboard";
import { useDebounce } from "@/hooks/useDebounce";
import { useUsers } from "@/hooks/useUsers";
import { exportBillsApi } from "@/api/bills.api";
import { ExportWithDateRange } from "@/components/common/export-with-date-range";
import { DateRangeFilter } from "@/components/common/date-range-filter";
import { getApiError } from "@/lib/utils";
import type { Invoice } from "@/types";

// ✅ Lazy load the chart – named export handled correctly
const DailyCollectionsChart = lazy(() =>
  import("@/components/charts/daily-collections-chart").then((module) => ({
    default: module.DailyCollectionsChart,
  }))
);

const METRICS_DAYS = 30;

export default function AdminDashboardPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState<string | undefined>("-created_at");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Invoice | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteBillId, setDeleteBillId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const billParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debouncedSearch || undefined,
      ordering,
      start_date: filterStartDate || undefined,
      end_date: filterEndDate || undefined,
    }),
    [page, pageSize, debouncedSearch, ordering, filterStartDate, filterEndDate]
  );

  const billsQuery = useBills(billParams);
  const usersQuery = useUsers("dra");
  // ✅ No longer fetching separate summary – derived from daily data if needed, but we only need daily
  const dailyQuery = useDashboardDailyCollections(METRICS_DAYS);
  const rebuildMutation = useRebuildDashboardDailyCollections(METRICS_DAYS);

  const handleSortChange = useCallback((ord: string | undefined) => {
    setOrdering(ord);
    setPage(1);
  }, []);

  const handleEdit = useCallback((bill: Invoice) => {
    setEditingBill(bill);
    setIsBillModalOpen(true);
  }, []);

  const handleDelete = useCallback((bill: Invoice) => {
    setDeleteBillId(bill.id);
  }, []);

  // ✅ Stable rebuild handler
  const handleRebuild = useCallback(async () => {
    try {
      await rebuildMutation.mutateAsync();
      toast.success("Dashboard metrics rebuilt");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }, [rebuildMutation]);

  // ✅ Memoize filters to prevent unnecessary re‑renders of BillsTable
  const filters = useMemo(
    () => (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by invoice number…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <DateRangeFilter
          startDate={filterStartDate}
          endDate={filterEndDate}
          onStartDateChange={(v) => {
            setFilterStartDate(v);
            setPage(1);
          }}
          onEndDateChange={(v) => {
            setFilterEndDate(v);
            setPage(1);
          }}
          onClear={() => {
            setFilterStartDate("");
            setFilterEndDate("");
            setPage(1);
          }}
        />
      </div>
    ),
    [search, filterStartDate, filterEndDate]
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Collections Overview"
          description="Track field collections, monitor ageing, and manage invoice assignments."
          actions={
            <>
              <Button
                onClick={() => {
                  setEditingBill(null);
                  setIsBillModalOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Bill
              </Button>
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Import
              </Button>
              <ExportWithDateRange
                exportFn={exportBillsApi}
                defaultFilename="bills_export.xlsx"
                buttonVariant="outline"
                buttonText="Export Bills"
              />
              <Button
                variant="outline"
                onClick={handleRebuild}
                disabled={rebuildMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {rebuildMutation.isPending ? "Refreshing…" : "Refresh Metrics"}
              </Button>
            </>
          }
        />

        {dailyQuery.isLoading ? (
          <Skeleton className="h-[420px] w-full rounded-[18px]" />
        ) : (
          <Suspense fallback={<Skeleton className="h-[420px] w-full rounded-[18px]" />}>
            <DailyCollectionsChart data={dailyQuery.data ?? []} />
          </Suspense>
        )}

        <BillsTable
          data={billsQuery.data?.results ?? []}
          total={billsQuery.data?.count ?? 0}
          page={page}
          pageSize={pageSize}
          ordering={ordering}
          isLoading={billsQuery.isLoading}
          isFetching={billsQuery.isFetching}
          users={usersQuery.data ?? []}
          onPageChange={setPage}
          onSortChange={handleSortChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          filters={filters}
        />
      </div>

      <BillFormModal open={isBillModalOpen} onOpenChange={setIsBillModalOpen} bill={editingBill} />
      <ImportBillsDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
      <DeleteBillDialog
        open={deleteBillId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteBillId(null);
        }}
        billId={deleteBillId}
      />
    </AppShell>
  );
}