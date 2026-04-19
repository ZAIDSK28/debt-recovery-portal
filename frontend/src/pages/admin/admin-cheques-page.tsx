// src/pages/admin/admin-cheques-page.tsx

import { useState } from "react";
import { Download, Filter } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { PaymentsTable } from "@/components/payments/payments-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePayments } from "@/hooks/usePayments";
import { exportPaymentsApi } from "@/api/payments.api";
import { downloadBlob, getApiError } from "@/lib/utils";

export default function AdminChequesPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const query = usePayments({
    page,
    page_size: pageSize,
    payment_method: "cheque",
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  const rows = query.data?.results ?? [];

  return (
    <AppShell title="Cheque History">
      <div className="space-y-6">
        <PageHeader
          title="Cheque History"
          description="Manage pending, cleared, and bounced cheque payments."
          actions={
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              onClick={async () => {
                if (startDate && endDate && startDate > endDate) {
                  toast.error("Start date cannot be after end date.");
                  return;
                }

                if ((query.data?.count ?? 0) === 0) {
                  toast.error("No cheque records available to export in the selected date range.");
                  return;
                }

                try {
                  const blob = await exportPaymentsApi({
                    payment_method: "cheque",
                    start_date: startDate || undefined,
                    end_date: endDate || undefined,
                  });
                  downloadBlob(blob, "cheque_history.xlsx");
                  toast.success("Cheque export started");
                } catch (error) {
                  toast.error(getApiError(error));
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export XLSX
            </Button>
          }
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="md:hidden">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowMobileFilters((prev) => !prev)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          <div className={`mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3 ${showMobileFilters ? "block" : "hidden md:grid"}`}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Start Date</label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">End Date</label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full sm:w-auto"
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full lg:hidden" />
            <Skeleton className="h-28 w-full lg:hidden" />
            <div className="hidden space-y-3 lg:block">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No cheque records" description="Cheque payments will appear here once recorded." />
        ) : (
          <PaymentsTable
            data={rows}
            total={query.data?.count ?? 0}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            editableStatus
          />
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto max-w-3xl">
          <Button
            className="w-full"
            variant="outline"
            onClick={async () => {
              if (startDate && endDate && startDate > endDate) {
                toast.error("Start date cannot be after end date.");
                return;
              }

              if ((query.data?.count ?? 0) === 0) {
                toast.error("No cheque records available to export in the selected date range.");
                return;
              }

              try {
                const blob = await exportPaymentsApi({
                  payment_method: "cheque",
                  start_date: startDate || undefined,
                  end_date: endDate || undefined,
                });
                downloadBlob(blob, "cheque_history.xlsx");
                toast.success("Cheque export started");
              } catch (error) {
                toast.error(getApiError(error));
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export XLSX
          </Button>
        </div>
      </div>

      <div className="h-20 md:hidden" />
    </AppShell>
  );
}