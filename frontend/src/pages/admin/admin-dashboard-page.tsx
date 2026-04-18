// src/pages/admin/admin-dashboard-page.tsx

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, HandCoins, Landmark, Plus, ReceiptIndianRupee, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { DailyCollectionsChart } from "@/components/charts/daily-collections-chart";
import { BillsTable } from "@/components/bills/bills-table";
import { BillFormModal } from "@/components/bills/bill-form-modal";
import { ImportBillsDialog } from "@/components/bills/import-bills-dialog";
import { DeleteBillDialog } from "@/components/bills/delete-bill-dialog";
import { useBills } from "@/hooks/useBills";
import { useDebounce } from "@/hooks/useDebounce";
import { useDailySummary, useTodayTotals } from "@/hooks/useReports";
import { useUsers } from "@/hooks/useUsers";
import { exportBillsApi } from "@/api/bills.api";
import { downloadBlob, formatCurrency, getApiError } from "@/lib/utils";
import type { Invoice } from "@/types";

export default function AdminDashboardPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [ordering] = useState("-created_at");

  const [billExportStartDate, setBillExportStartDate] = useState("");
  const [billExportEndDate, setBillExportEndDate] = useState("");

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Invoice | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteBillId, setDeleteBillId] = useState<number | null>(null);

  const billsQuery = useBills({
    page,
    page_size: pageSize,
    search: debouncedSearch,
    ordering,
  });
  const usersQuery = useUsers("dra");
  const totalsQuery = useTodayTotals();
  const dailySummaryQuery = useDailySummary(30);

  const invoices = billsQuery.data?.results ?? [];
  const totalInvoices = billsQuery.data?.count ?? 0;
  const users = usersQuery.data ?? [];

  const actions = useMemo(
    () => (
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
          Import Bills
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            if (billExportStartDate && billExportEndDate && billExportStartDate > billExportEndDate) {
              toast.error("Start date cannot be after end date.");
              return;
            }

            if ((billsQuery.data?.count ?? 0) === 0) {
              toast.error("No invoice records available to export.");
              return;
            }

            try {
              const blob = await exportBillsApi({
                start_date: billExportStartDate || undefined,
                end_date: billExportEndDate || undefined,
              });
              downloadBlob(blob, "bills_export.xlsx");
              toast.success("Bills export started");
            } catch (error) {
              toast.error(getApiError(error));
            }
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Bills
        </Button>
      </>
    ),
    [billExportStartDate, billExportEndDate, billsQuery.data?.count]
  );

  return (
    <AppShell title="Admin Dashboard">
      <div className="space-y-6">
        <PageHeader
          title="Collections Overview"
          description="Track field collections, monitor ageing, and manage invoice assignments."
          actions={actions}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Today Cash Collection"
            value={formatCurrency(totalsQuery.data?.cash_total ?? 0)}
            icon={HandCoins}
            accentClassName="bg-emerald-500"
          />
          <KpiCard
            title="Today UPI Collection"
            value={formatCurrency(totalsQuery.data?.upi_total ?? 0)}
            icon={Wallet}
            accentClassName="bg-blue-500"
          />
          <KpiCard
            title="Today Cleared Cheques"
            value={formatCurrency(totalsQuery.data?.cheque_total ?? 0)}
            icon={ReceiptIndianRupee}
            accentClassName="bg-amber-500"
          />
          <KpiCard
            title="Today Electronic Clearance"
            value={formatCurrency(totalsQuery.data?.electronic_total ?? 0)}
            icon={Landmark}
            accentClassName="bg-violet-500"
          />
        </div>

        {dailySummaryQuery.isLoading ? (
          <Skeleton className="h-105 w-full rounded-2xl" />
        ) : (
          <DailyCollectionsChart data={dailySummaryQuery.data ?? []} />
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
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
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Export Start Date</label>
              <Input type="date" value={billExportStartDate} onChange={(e) => setBillExportStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Export End Date</label>
              <Input type="date" value={billExportEndDate} onChange={(e) => setBillExportEndDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button
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
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description="Create a new invoice or adjust your search to view records."
          />
        ) : (
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
        )}
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