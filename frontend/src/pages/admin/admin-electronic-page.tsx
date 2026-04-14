import { useState } from "react";
import { Download } from "lucide-react";
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

export default function AdminElectronicPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const query = usePayments({
    page,
    page_size: pageSize,
    payment_method: "electronic",
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  const rows = query.data?.results ?? [];

  return (
    <AppShell title="Electronic History">
      <div className="space-y-6">
        <PageHeader
          title="Electronic History"
          description="Track electronic submissions and update clearance status."
          actions={
            <Button
              variant="outline"
              onClick={async () => {
                if (startDate && endDate && startDate > endDate) {
                  toast.error("Start date cannot be after end date.");
                  return;
                }

                if ((query.data?.count ?? 0) === 0) {
                  toast.error("No electronic records available to export in the selected date range.");
                  return;
                }

                try {
                  const blob = await exportPaymentsApi({
                    payment_method: "electronic",
                    start_date: startDate || undefined,
                    end_date: endDate || undefined,
                  });
                  downloadBlob(blob, "electronic_history.xlsx");
                  toast.success("Electronic export started");
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

        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
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

        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No electronic records"
            description="Electronic payment entries will appear here once recorded."
          />
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
    </AppShell>
  );
}