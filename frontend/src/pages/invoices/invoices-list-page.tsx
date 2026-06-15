// src/pages/invoices/invoices-list-page.tsx
import { useCallback, useMemo, useState } from "react";
import { Download, Eye, FileText, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/lib/toast";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { InvoiceStatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";
import { downloadInvoicePdfApi, getPrintableInvoiceHtmlApi } from "@/api/invoices.api";
import { ExportWithDateRange } from "@/components/common/export-with-date-range";
import { DateRangeFilter } from "@/components/common/date-range-filter";
import { useDebounce } from "@/hooks/useDebounce";
import { useInvoiceReports } from "@/hooks/useInvoices";
import { downloadBlob, formatCurrency, formatDate, getApiError } from "@/lib/utils";
import type { InvoiceReportListItem } from "@/types";

const exportInvoicesApi = async (params: { start_date?: string; end_date?: string }) => {
  throw new Error("Export not implemented yet");
};

function ActionCell({ row, onView, onEdit, onPrint, onPdf, onDelete }: any) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button variant="ghost" size="icon" title="View" onClick={onView}><Eye className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" title="Edit" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" title="Print" onClick={onPrint}><Printer className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" title="Download PDF" onClick={onPdf}><Download className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" title="Delete" onClick={onDelete} className="text-[#9898B4] hover:bg-[#FDEEF1] hover:text-[#E04E6A]"><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

export default function InvoicesListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState<string | undefined>("-created_at");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceReportListItem | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(
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

  const query = useInvoiceReports(params);
  const handleSortChange = useCallback((ord: string | undefined) => {
    setOrdering(ord);
    setPage(1);
  }, []);

  const handlePrint = useCallback(async (id: number, invoiceNumber: string) => {
    try {
      const html = await getPrintableInvoiceHtmlApi(id);
      const w = window.open("", "_blank", "width=1024,height=768");
      if (!w) { toast.error("Unable to open print window."); return; }
      w.document.open(); w.document.write(html); w.document.close(); w.focus();
      w.onload = () => w.print();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }, []);

  const handlePdf = useCallback(async (id: number, invoiceNumber: string) => {
    try {
      const blob = await downloadInvoicePdfApi(id);
      downloadBlob(blob, `${invoiceNumber}.pdf`);
      toast.success("PDF download started");
    } catch (err) {
      toast.error(getApiError(err));
    }
  }, []);

  const confirmDelete = useCallback((invoice: InvoiceReportListItem) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirmed = useCallback(() => {
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
    query.refetch();
  }, [query]);

  const handleView = useCallback((id: number) => {
    navigate(`/invoices/${id}`);
  }, [navigate]);

  const handleEdit = useCallback((id: number) => {
    navigate(`/invoices/${id}/edit`);
  }, [navigate]);

  const columns = useMemo<DataTableColumn<InvoiceReportListItem>[]>(() => [
    { key: "invoice_number", header: "Invoice No.", sortKey: "invoice_number", render: (r) => <span className="font-mono text-[12px] font-semibold text-[#6F72BE]">{r.invoice_number}</span> },
    { key: "invoice_date", header: "Date", sortKey: "invoice_date", render: (r) => <span className="text-[#9898B4]">{formatDate(r.invoice_date)}</span> },
    { key: "customer_name", header: "Customer", sortKey: "customer_name", cellClassName: "max-w-[140px] truncate" },
    { key: "status", header: "Status", render: (r) => <InvoiceStatusBadge status={r.status} /> },
    { key: "route_name", header: "Route", cellClassName: "max-w-[110px] truncate text-[#6B6B8A]", render: (r) => r.route_name || "—" },
    { key: "outlet_name", header: "Outlet", cellClassName: "max-w-[110px] truncate text-[#6B6B8A]", render: (r) => r.outlet_name || "—" },
    { key: "brand", header: "Brand", render: (r) => r.brand || "—" },
    { key: "subtotal", header: "Subtotal", sortKey: "subtotal", render: (r) => <span className="tabular-nums">{formatCurrency(r.subtotal)}</span> },
    { key: "tax_amount", header: "Tax", render: (r) => <span className="tabular-nums text-[#9898B4]">{formatCurrency(r.tax_amount)}</span> },
    { key: "total_amount", header: "Total", sortKey: "total_amount", render: (r) => <span className="font-semibold tabular-nums">{formatCurrency(r.total_amount)}</span> },
    { key: "linked_bill_id", header: "Bill", render: (r) => r.linked_bill_id ? <span className="font-mono text-[11px] text-[#9898B4]">#{r.linked_bill_id}</span> : "—" },
    { key: "created_at", header: "Created", sortKey: "created_at", render: (r) => <span className="text-[#9898B4]">{formatDate(r.created_at)}</span> },
    { key: "actions", header: "", headerClassName: "w-[130px]", cellClassName: "w-[130px]", render: (r) => <ActionCell row={r} onView={() => handleView(r.id)} onEdit={() => handleEdit(r.id)} onPrint={() => handlePrint(r.id, r.invoice_number)} onPdf={() => handlePdf(r.id, r.invoice_number)} onDelete={() => confirmDelete(r)} /> },
  ], [handleView, handleEdit, handlePrint, handlePdf, confirmDelete]);

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Invoice List"
          description="Manage printable invoices separately from dashboard bills."
          actions={
            <div className="flex gap-2">
              <ExportWithDateRange
                exportFn={exportInvoicesApi}
                defaultFilename="invoices_export.xlsx"
                buttonVariant="outline"
                buttonText="Export"
              />
              <Button onClick={() => navigate("/invoices/new")}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create Invoice
              </Button>
            </div>
          }
        />
        <DataTable
          columns={columns}
          data={query.data?.results ?? []}
          total={query.data?.count ?? 0}
          page={page}
          pageSize={pageSize}
          ordering={ordering}
          isLoading={query.isLoading}
          isFetching={query.isFetching}
          onPageChange={setPage}
          onSortChange={handleSortChange}
          rowKey={(r) => r.id}
          minWidth={1300}
          filters={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by invoice number, customer…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <DateRangeFilter
                startDate={filterStartDate}
                endDate={filterEndDate}
                onStartDateChange={(v) => { setFilterStartDate(v); setPage(1); }}
                onEndDateChange={(v) => { setFilterEndDate(v); setPage(1); }}
                onClear={() => { setFilterStartDate(""); setFilterEndDate(""); setPage(1); }}
              />
            </div>
          }
          emptyState={
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="No invoices found"
              description="Create a new printable invoice to get started."
              action={<Button onClick={() => navigate("/invoices/new")}><Plus className="mr-1.5 h-3.5 w-3.5" />Create Invoice</Button>}
            />
          }
        />
        <DeleteInvoiceDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} invoiceId={invoiceToDelete?.id ?? null} onDeleted={handleDeleteConfirmed} />
      </div>
    </AppShell>
  );
}