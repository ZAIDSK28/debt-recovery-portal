// src/pages/invoices/invoices-list-page.tsx

import { useMemo, useState } from "react";
import { Download, Eye, FileText, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { InvoiceStatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrapper, TBody, TD, TH, THead } from "@/components/ui/table";
import { downloadInvoicePdfApi, getPrintableInvoiceHtmlApi } from "@/api/invoices.api";
import { useDebounce } from "@/hooks/useDebounce";
import { useDeleteInvoiceReport, useInvoiceReports } from "@/hooks/useInvoices";
import { downloadBlob, formatCurrency, formatDate, getApiError } from "@/lib/utils";
import type { InvoiceReportListItem } from "@/types";
import { ResponsiveTableSkeleton } from "@/components/common/loading-state";

function InvoiceRowActions({
  invoice,
  editLocked,
  onView,
  onEdit,
  onPrint,
  onPdf,
  onDelete,
}: {
  invoice: InvoiceReportListItem;
  editLocked: boolean;
  onView: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onPdf: () => void;
  onDelete: () => void;
}) {
  const canEdit = !editLocked;
  const canDelete = true;

  return (
    <div className="flex min-w-[400px] justify-end gap-2">
      <Button variant="outline" size="sm" onClick={onView}>
        <Eye className="mr-1 h-4 w-4" />
        View
      </Button>
      <Button variant="outline" size="sm" onClick={onEdit} disabled={!canEdit}>
        <Pencil className="mr-1 h-4 w-4" />
        Edit
      </Button>
      <Button variant="outline" size="sm" onClick={onPrint}>
        <Printer className="mr-1 h-4 w-4" />
        Print
      </Button>
      <Button variant="outline" size="sm" onClick={onPdf}>
        <Download className="mr-1 h-4 w-4" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={onDelete} disabled={!canDelete}>
        <Trash2 className="mr-1 h-4 w-4 text-red-500" />
        Delete
      </Button>
    </div>
  );
}

export default function InvoicesListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [lockedInvoiceIds, setLockedInvoiceIds] = useState<number[]>([]);
  const debouncedSearch = useDebounce(search, 500);
  const deleteMutation = useDeleteInvoiceReport();

  const invoiceParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debouncedSearch || undefined,
      ordering: "-created_at",
    }),
    [page, pageSize, debouncedSearch]
  );

  const query = useInvoiceReports(invoiceParams);
  const rows = query.data?.results ?? [];

  const actions = useMemo(
    () => (
      <Button className="w-full sm:w-auto" onClick={() => navigate("/invoices/new")}>
        <Plus className="mr-2 h-4 w-4" />
        Create Invoice
      </Button>
    ),
    [navigate]
  );

  async function handlePrint(id: number, invoiceNumber: string) {
    try {
      const html = await getPrintableInvoiceHtmlApi(id);
      const printWindow = window.open("", "_blank", "width=1024,height=768");

      if (!printWindow) {
        toast.error("Unable to open print window.");
        return;
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      printWindow.onload = () => {
        printWindow.print();
      };

      toast.success(`Print preview opened for ${invoiceNumber}`);
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  async function handleDownloadPdf(id: number, invoiceNumber: string) {
    try {
      const blob = await downloadInvoicePdfApi(id);
      downloadBlob(blob, `${invoiceNumber}.pdf`);
      toast.success("PDF download started");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Deleting this invoice will also permanently delete its linked bill and all related payments. This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Invoice deleted");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <AppShell title="Invoices">
      <div className="space-y-5">
        <PageHeader
          title="Invoice List"
          description="Manage printable invoices separately from dashboard bills."
          actions={actions}
        />

        <div className="rounded-[18px] border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="w-full max-w-sm">
            <SearchInput
              placeholder="Search invoices..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {query.isLoading ? (
          <ResponsiveTableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No invoices found"
            description="Create a new printable invoice to get started."
            action={
              <Button className="w-full sm:w-auto" onClick={() => navigate("/invoices/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
            <TableWrapper className="w-full rounded-none border-0 shadow-none">
              <Table className="min-w-[1600px] w-full table-auto">
                <THead>
                  <tr>
                    <TH>Invoice Number</TH>
                    <TH>Invoice Date</TH>
                    <TH>Customer Name</TH>
                    <TH>Status</TH>
                    <TH>Route Name</TH>
                    <TH>Outlet Name</TH>
                    <TH>Brand</TH>
                    <TH>Subtotal</TH>
                    <TH>Tax Amount</TH>
                    <TH>Discount</TH>
                    <TH>Total Amount</TH>
                    <TH>Creation Mode</TH>
                    <TH>Linked Bill</TH>
                    <TH>Created At</TH>
                    <TH>Updated At</TH>
                    <TH className="w-[420px] text-right">Actions</TH>
                  </tr>
                </THead>
                <TBody>
                  {rows.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-slate-100 align-top transition-colors hover:bg-sky-50">
                      <TD className="whitespace-normal break-words font-medium text-slate-900">
                        {invoice.invoice_number}
                      </TD>
                      <TD>{formatDate(invoice.invoice_date)}</TD>
                      <TD className="whitespace-normal break-words">{invoice.customer_name}</TD>
                      <TD><InvoiceStatusBadge status={invoice.status} /></TD>
                      <TD className="whitespace-normal break-words">{invoice.route_name || "—"}</TD>
                      <TD className="whitespace-normal break-words">{invoice.outlet_name || "—"}</TD>
                      <TD className="whitespace-normal break-words">{invoice.brand || "—"}</TD>
                      <TD>{formatCurrency(invoice.subtotal)}</TD>
                      <TD>{formatCurrency(invoice.tax_amount)}</TD>
                      <TD>{formatCurrency(invoice.discount_amount)}</TD>
                      <TD>{formatCurrency(invoice.total_amount)}</TD>
                      <TD className="whitespace-normal capitalize">{invoice.creation_mode.replaceAll("_", " ")}</TD>
                      <TD>{invoice.linked_bill_id ? `#${invoice.linked_bill_id}` : "—"}</TD>
                      <TD>{formatDate(invoice.created_at)}</TD>
                      <TD>{formatDate(invoice.updated_at)}</TD>
                      <TD className="whitespace-nowrap">
                        <InvoiceRowActions
                          invoice={invoice}
                          editLocked={lockedInvoiceIds.includes(invoice.id)}
                          onView={() => navigate(`/invoices/${invoice.id}`)}
                          onEdit={() => navigate(`/invoices/${invoice.id}/edit`, { state: { lockTrackerEnabled: true } })}
                          onPrint={() => void handlePrint(invoice.id, invoice.invoice_number)}
                          onPdf={() => void handleDownloadPdf(invoice.id, invoice.invoice_number)}
                          onDelete={() => void handleDelete(invoice.id)}
                        />
                      </TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </TableWrapper>

            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={query.data?.count ?? 0}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}