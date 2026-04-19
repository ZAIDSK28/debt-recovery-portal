// src/pages/invoices/invoices-list-page.tsx

import { Download, Eye, Plus, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableWrapper, TBody, TD, TH, THead } from "@/components/ui/table";
import { useDebounce } from "@/hooks/useDebounce";
import { useInvoiceReports } from "@/hooks/useInvoices";
import { downloadBlob, formatCurrency, formatDate, getApiError } from "@/lib/utils";
import { downloadInvoicePdfApi, getPrintableInvoiceHtmlApi } from "@/api/invoices.api";
import { useMemo, useState } from "react";

export default function InvoicesListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const query = useInvoiceReports({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    ordering: "-created_at",
  });

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

  return (
    <AppShell title="Invoices">
      <div className="space-y-6">
        <PageHeader
          title="Invoice List"
          description="Manage printable invoices separately from dashboard bills."
          actions={actions}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
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
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <TableWrapper className="rounded-none border-0">
              <Table className="min-w-[1100px]">
                <THead>
                  <tr>
                    <TH>Invoice Number</TH>
                    <TH>Invoice Date</TH>
                    <TH>Customer Name</TH>
                    <TH>Route Name</TH>
                    <TH>Outlet Name</TH>
                    <TH>Brand</TH>
                    <TH>Total Amount</TH>
                    <TH>Creation Mode</TH>
                    <TH>Linked Bill</TH>
                    <TH>Created At</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <TBody>
                  {rows.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-slate-100 transition-colors hover:bg-indigo-50/40">
                      <TD className="font-medium text-slate-900">{invoice.invoice_number}</TD>
                      <TD>{formatDate(invoice.invoice_date)}</TD>
                      <TD>{invoice.customer_name}</TD>
                      <TD>{invoice.route_name || "—"}</TD>
                      <TD>{invoice.outlet_name || "—"}</TD>
                      <TD>{invoice.brand || "—"}</TD>
                      <TD>{formatCurrency(invoice.total_amount)}</TD>
                      <TD className="capitalize">{invoice.creation_mode.replaceAll("_", " ")}</TD>
                      <TD>{invoice.linked_bill_id ?? "—"}</TD>
                      <TD>{formatDate(invoice.created_at)}</TD>
                      <TD>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handlePrint(invoice.id, invoice.invoice_number)}
                          >
                            <Printer className="mr-1 h-4 w-4" />
                            Print
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleDownloadPdf(invoice.id, invoice.invoice_number)}
                          >
                            <Download className="mr-1 h-4 w-4" />
                            PDF
                          </Button>
                        </div>
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