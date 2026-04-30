// src/pages/invoices/invoice-edit-page.tsx

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveTableSkeleton } from "@/components/common/loading-state";
import { useInvoiceReport } from "@/hooks/useInvoices";

export default function InvoiceEditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const invoiceId = Number(params.id);
  const query = useInvoiceReport(invoiceId, Number.isFinite(invoiceId));
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (location.state && typeof location.state === "object" && "locked" in location.state) {
      setLocked(Boolean((location.state as { locked?: boolean }).locked));
    }
  }, [location.state]);

  if (!Number.isFinite(invoiceId)) {
    return (
      <AppShell title="Edit Invoice">
        <EmptyState title="Invalid invoice" description="The requested invoice id is invalid." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit Invoice">
      <div className="space-y-5">
        <PageHeader
          title="Edit Invoice"
          description="Update printable invoice details."
        />

        {locked ? (
          <EmptyState
            title="Invoice locked"
            description="This invoice is locked because payment collection has already started."
          />
        ) : query.isLoading ? (
          <ResponsiveTableSkeleton />
        ) : !query.data ? (
          <EmptyState title="Invoice not found" description="The requested invoice could not be loaded." />
        ) : (
          <InvoiceForm
            initialInvoice={query.data}
            onUpdated={(invoice) => {
              navigate(`/invoices/${invoice.id}`, { replace: true });
            }}
            onLocked={() => {
              setLocked(true);
              toast.error("This invoice is locked because payment collection has already started.");
            }}
          />
        )}
      </div>
    </AppShell>
  );
}