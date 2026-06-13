import { useCallback, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  Download,
  FileSpreadsheet,
  Plus,
  ReceiptIndianRupee,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { SearchInput } from "@/components/common/search-input";
import { BillsTable } from "@/components/bills/bills-table";
import { BillFormModal } from "@/components/bills/bill-form-modal";
import { ImportBillsDialog } from "@/components/bills/import-bills-dialog";
import { DeleteBillDialog } from "@/components/bills/delete-bill-dialog";
import { DailyCollectionsChart } from "@/components/charts/daily-collections-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { useBills } from "@/hooks/useBills";
import {
  useDashboardDailyCollections,
  useDashboardSummary,
  useRebuildDashboardDailyCollections,
} from "@/hooks/useDashboard";
import { useDebounce } from "@/hooks/useDebounce";
import { useUsers } from "@/hooks/useUsers";
import { exportBillsWithMetaApi } from "@/api/bills.api";
import {
  downloadBlob,
  fallbackBillsExportFileName,
  formatCurrency,
  getApiError,
} from "@/lib/utils";
import type { Invoice } from "@/types";

const METRICS_DAYS = 30;

export default function AdminDashboardPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState<string | undefined>("-created_at");
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Invoice | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteBillId, setDeleteBillId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const billParams = useMemo(
    () => ({ page, page_size: pageSize, search: debouncedSearch || undefined, ordering }),
    [page, pageSize, debouncedSearch, ordering]
  );

  const billsQuery = useBills(billParams);
  const usersQuery = useUsers("dra");
  const summaryQuery = useDashboardSummary(METRICS_DAYS);
  const dailyQuery = useDashboardDailyCollections(METRICS_DAYS);
  const rebuildMutation = useRebuildDashboardDailyCollections(METRICS_DAYS);

  const handleSortChange = useCallback((ord: string | undefined) => {
    setOrdering(ord);
    setPage(1);
  }, []);

  async function handleExportBills() {
    if (exportStart && exportEnd && exportStart > exportEnd) {
      toast.error("Start date cannot be after end date.");
      return;
    }

    if ((billsQuery.data?.count ?? 0) === 0) {
      toast.error("No records to export.");
      return;
    }

    try {
      const p = {
        start_date: exportStart || undefined,
        end_date: exportEnd || undefined,
      };
      const { blob, filename } = await exportBillsWithMetaApi(p);
      downloadBlob(blob, filename || fallbackBillsExportFileName(p));
      toast.success("Bills export started");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  async function handleRebuild() {
    try {
      await rebuildMutation.mutateAsync();
      toast.success("Dashboard metrics rebuilt");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  const kpis = summaryQuery.data;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Collections Overview"
          description="Track field collections, monitor ageing, and manage invoice assignments."
          actions={
            <>
              <Button onClick={() => { setEditingBill(null); setIsBillModalOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                New Bill
              </Button>
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" onClick={() => void handleExportBills()}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleRebuild()}
                disabled={rebuildMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {rebuildMutation.isPending ? "Refreshing…" : "Refresh Metrics"}
              </Button>
            </>
          }
        />

        {/* <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <KpiCard
            title="Total Collection"
            value={formatCurrency(kpis?.total_collection ?? 0)}
            icon={BadgeIndianRupee}
            accentClassName="bg-[#6F72BE]"
          />
          <KpiCard
            title="Total Payments"
            value={String(kpis?.total_payments ?? 0)}
            icon={Wallet}
            accentClassName="bg-[#22A55A]"
          />
          <KpiCard
            title="Cleared Bills"
            value={String(kpis?.total_cleared_bills ?? 0)}
            icon={ReceiptIndianRupee}
            accentClassName="bg-[#D97B0A]"
          />
          <KpiCard
            title="Cash"
            value={formatCurrency(kpis?.total_cash ?? 0)}
            icon={Wallet}
            accentClassName="bg-[#22A55A]"
          />
          <KpiCard
            title="UPI"
            value={formatCurrency(kpis?.total_upi ?? 0)}
            icon={Wallet}
            accentClassName="bg-[#6F72BE]"
          />
          <KpiCard
            title="Cheque"
            value={formatCurrency(kpis?.total_cheque ?? 0)}
            icon={ReceiptIndianRupee}
            accentClassName="bg-[#D97B0A]"
          />
          <KpiCard
            title="Electronic"
            value={formatCurrency(kpis?.total_electronic ?? 0)}
            icon={Wallet}
            accentClassName="bg-[#6F72BE]"
          />
        </div> */}

        {dailyQuery.isLoading ? (
          <Skeleton className="h-[420px] w-full rounded-[18px]" />
        ) : (
          <DailyCollectionsChart data={dailyQuery.data ?? []} />
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
          onEdit={(bill) => {
            setEditingBill(bill);
            setIsBillModalOpen(true);
          }}
          onDelete={(bill) => setDeleteBillId(bill.id)}
          filters={
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

              <div className="flex flex-col gap-1">
                <Label className="text-[11px] text-[#9898B4]">Export start</Label>
                <DateInput
                  value={exportStart}
                  onChange={setExportStart}
                  clearable
                  max={exportEnd || undefined}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-[11px] text-[#9898B4]">Export end</Label>
                <DateInput
                  value={exportEnd}
                  onChange={setExportEnd}
                  clearable
                  min={exportStart || undefined}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExportStart("");
                  setExportEnd("");
                }}
              >
                Reset
              </Button>
            </div>
          }
        />
      </div>

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