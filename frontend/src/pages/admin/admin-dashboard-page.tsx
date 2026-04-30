// src/pages/admin/admin-dashboard-page.tsx
import { useMemo, useState } from "react";
import { BadgeIndianRupee, Download, FileSpreadsheet, Filter, Plus, RefreshCw, ReceiptIndianRupee, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DateInput } from "@/components/ui/date-input";
import { DailyCollectionsChart } from "@/components/charts/daily-collections-chart";
import { BillsTable } from "@/components/bills/bills-table";
import { BillFormModal } from "@/components/bills/bill-form-modal";
import { ImportBillsDialog } from "@/components/bills/import-bills-dialog";
import { DeleteBillDialog } from "@/components/bills/delete-bill-dialog";
import { useBills } from "@/hooks/useBills";
import { useDashboardDailyCollections, useDashboardSummary, useRebuildDashboardDailyCollections } from "@/hooks/useDashboard";
import { useDebounce } from "@/hooks/useDebounce";
import { useUsers } from "@/hooks/useUsers";
import { exportBillsWithMetaApi } from "@/api/bills.api";
import { downloadBlob, fallbackBillsExportFileName, formatCurrency, getApiError } from "@/lib/utils";
import type { Invoice } from "@/types";
import { ResponsiveTableSkeleton } from "@/components/common/loading-state";

export default function AdminDashboardPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [ordering] = useState("-created_at");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [billExportStartDate, setBillExportStartDate] = useState("");
  const [billExportEndDate, setBillExportEndDate] = useState("");

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Invoice | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteBillId, setDeleteBillId] = useState<number | null>(null);

  const metricsDays = 30;

  const billParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debouncedSearch,
      ordering,
    }),
    [page, pageSize, debouncedSearch, ordering]
  );

  const billsQuery = useBills(billParams);
  const usersQuery = useUsers("dra");
  const dashboardSummaryQuery = useDashboardSummary(metricsDays);
  const dailyCollectionsQuery = useDashboardDailyCollections(metricsDays);
  const rebuildMutation = useRebuildDashboardDailyCollections(metricsDays);

  const invoices = billsQuery.data?.results ?? [];
  const totalInvoices = billsQuery.data?.count ?? 0;
  const users = usersQuery.data ?? [];

  async function handleExportBills() {
    if (billExportStartDate && billExportEndDate && billExportStartDate > billExportEndDate) {
      toast.error("Start date cannot be after end date.");
      return;
    }

    if ((billsQuery.data?.count ?? 0) === 0) {
      toast.error("No invoice records available to export.");
      return;
    }

    try {
      const params = {
        start_date: billExportStartDate || undefined,
        end_date: billExportEndDate || undefined,
      };

      const { blob, filename } = await exportBillsWithMetaApi(params);
      downloadBlob(blob, filename || fallbackBillsExportFileName(params));
      toast.success("Bills export started");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  async function handleRebuildMetrics() {
    try {
      await rebuildMutation.mutateAsync();
      toast.success("Dashboard metrics rebuilt");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  const actions = useMemo(
    () => (
      <>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingBill(null);
            setIsBillModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Bill
        </Button>
        <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsImportOpen(true)}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import Bills
        </Button>
        <Button className="w-full sm:w-auto" variant="outline" onClick={() => void handleExportBills()}>
          <Download className="mr-2 h-4 w-4" />
          Export Bills
        </Button>
        <Button className="w-full sm:w-auto" variant="outline" onClick={() => void handleRebuildMetrics()} disabled={rebuildMutation.isPending}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {rebuildMutation.isPending ? "Refreshing..." : "Refresh Metrics"}
        </Button>
      </>
    ),
    [rebuildMutation.isPending, billExportEndDate, billExportStartDate, billsQuery.data?.count]
  );

  return (
    <AppShell title="Admin Dashboard">
      <div className="w-full max-w-none space-y-6">
        <PageHeader
          title="Collections Overview"
          description="Track field collections, monitor ageing, and manage invoice assignments."
          actions={actions}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Total Collection"
            value={formatCurrency(dashboardSummaryQuery.data?.total_collection ?? 0)}
            icon={BadgeIndianRupee}
            accentClassName="bg-violet-500"
          />
          <KpiCard
            title="Total Payments"
            value={String(dashboardSummaryQuery.data?.total_payments ?? 0)}
            icon={Wallet}
            accentClassName="bg-sky-500"
          />
          <KpiCard
            title="Cleared Bills"
            value={String(dashboardSummaryQuery.data?.total_cleared_bills ?? 0)}
            icon={ReceiptIndianRupee}
            accentClassName="bg-amber-500"
          />
          <KpiCard
            title="Cash Collection"
            value={formatCurrency(dashboardSummaryQuery.data?.total_cash ?? 0)}
            icon={Wallet}
            accentClassName="bg-green-500"
          />
          <KpiCard
            title="UPI Collection"
            value={formatCurrency(dashboardSummaryQuery.data?.total_upi ?? 0)}
            icon={Wallet}
            accentClassName="bg-sky-500"
          />
          <KpiCard
            title="Cheque Collection"
            value={formatCurrency(dashboardSummaryQuery.data?.total_cheque ?? 0)}
            icon={ReceiptIndianRupee}
            accentClassName="bg-amber-500"
          />
          <KpiCard
            title="Electronic Collection"
            value={formatCurrency(dashboardSummaryQuery.data?.total_electronic ?? 0)}
            icon={Wallet}
            accentClassName="bg-violet-500"
          />
        </div>

        {dailyCollectionsQuery.isLoading ? (
          <Skeleton className="h-[320px] w-full rounded-2xl sm:h-[420px]" />
        ) : (
          <DailyCollectionsChart data={dailyCollectionsQuery.data ?? []} />
        )}

        <div className="w-full space-y-4 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full max-w-sm">
              <SearchInput
                placeholder="Search by invoice number..."
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full md:hidden"
              onClick={() => setShowMobileFilters((prev) => !prev)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          <div className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${showMobileFilters ? "block" : "hidden md:grid"}`}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Export Start Date</label>
              <DateInput
                value={billExportStartDate}
                onChange={setBillExportStartDate}
                clearable
                max={billExportEndDate || undefined}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Export End Date</label>
              <DateInput
                value={billExportEndDate}
                onChange={setBillExportEndDate}
                clearable
                min={billExportStartDate || undefined}
              />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full sm:w-auto"
                variant="outline"
                onClick={() => {
                  setBillExportStartDate("");
                  setBillExportEndDate("");
                }}
              >
                Reset Export Dates
              </Button>
            </div>
          </div>
        </div>

        {billsQuery.isLoading ? (
          <ResponsiveTableSkeleton />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<FileSpreadsheet className="h-6 w-6" />}
            title="No invoices found"
            description="Create a new invoice or adjust your search to view records."
          />
        ) : (
          <div className="w-full">
            <BillsTable
              data={invoices}
              total={totalInvoices}
              page={page}
              pageSize={pageSize}
              users={users}
              onPageChange={setPage}
              onEdit={(bill) => {
                setEditingBill(bill);
                setIsBillModalOpen(true);
              }}
              onDelete={(bill) => setDeleteBillId(bill.id)}
            />
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Button
            className="flex-1"
            onClick={() => {
              setEditingBill(null);
              setIsBillModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Bill
          </Button>
          <Button className="flex-1" variant="outline" onClick={() => setIsImportOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      <div className="h-20 md:hidden" />

      <BillFormModal
        open={isBillModalOpen}
        onOpenChange={setIsBillModalOpen}
        bill={editingBill}
      />

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