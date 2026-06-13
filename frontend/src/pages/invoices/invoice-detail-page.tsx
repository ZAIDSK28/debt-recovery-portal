// src/pages/invoices/invoice-detail-page.tsx
import { useCallback, useState } from "react";
import { ArrowLeft, Download, Pencil, Printer, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { InvoiceStatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrapper, TBody, TD, TH, THead } from "@/components/ui/table";
import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";
import { downloadInvoicePdfApi, getPrintableInvoiceHtmlApi } from "@/api/invoices.api";
import { useInvoiceReport } from "@/hooks/useInvoices";
import { downloadBlob, formatCurrency, formatDate, getApiError } from "@/lib/utils";
import { ResponsiveTableSkeleton } from "@/components/common/loading-state";

export default function InvoiceDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const invoiceId = Number(params.id);
  const query = useInvoiceReport(invoiceId, Number.isFinite(invoiceId));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handlePrint = useCallback(async () => {
    if (!Number.isFinite(invoiceId) || !query.data) return;

    try {
      const html = await getPrintableInvoiceHtmlApi(invoiceId);
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
    } catch (error) {
      toast.error(getApiError(error));
    }
  }, [invoiceId, query.data]);

  const handleDownloadPdf = useCallback(async () => {
    if (!Number.isFinite(invoiceId) || !query.data) return;

    try {
      const blob = await downloadInvoicePdfApi(invoiceId);
      downloadBlob(blob, `${query.data.invoice_number}.pdf`);
      toast.success("PDF download started");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }, [invoiceId, query.data]);

  const handleBack = useCallback(() => {
    navigate("/invoices");
  }, [navigate]);

  const handleEdit = useCallback((id: number) => {
    navigate(`/invoices/${id}/edit`);
  }, [navigate]);

  const handleDeleted = useCallback(() => {
    navigate("/invoices", { replace: true });
  }, [navigate]);

  if (!Number.isFinite(invoiceId)) {
    return (
      <AppShell title="Invoice Detail">
        <EmptyState title="Invalid invoice" description="The requested invoice id is invalid." />
      </AppShell>
    );
  }

  const invoice = query.data;

  return (
    <AppShell title="Invoice Detail">
      <div className="space-y-5">
        <PageHeader
          title={invoice ? `Invoice ${invoice.invoice_number}` : "Invoice Detail"}
          description="View printable invoice details and linked bill information."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleBack} className="h-9 gap-1.5 text-sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              {invoice && (
                <>
                  <Button variant="outline" onClick={() => handleEdit(invoice.id)} className="h-9 gap-1.5 text-sm">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button onClick={() => void handlePrint()} className="h-9 gap-1.5 text-sm">
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={() => void handleDownloadPdf()} className="h-9 gap-1.5 text-sm">
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="h-9 gap-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          }
        />

        {query.isLoading ? (
          <ResponsiveTableSkeleton />
        ) : !invoice ? (
          <EmptyState title="Invoice not found" description="The requested invoice could not be loaded." />
        ) : (
          <>
            {/* Info grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Invoice Header</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice Number:</span>
                    <span className="font-mono font-medium">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice Date:</span>
                    <span>{formatDate(invoice.invoice_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creation Mode:</span>
                    <span className="capitalize">{invoice.creation_mode.replaceAll("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created At:</span>
                    <span>{formatDate(invoice.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Updated At:</span>
                    <span>{formatDate(invoice.updated_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Linked Bill ID:</span>
                    <span>{invoice.linked_bill_id ?? "—"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer Name:</span>
                    <span className="font-medium">{invoice.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span>{invoice.customer_phone || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">GST Number:</span>
                    <span>{invoice.gst_number || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address:</span>
                    <span className="text-right">{invoice.customer_address || "—"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Bill Mapping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Route Name:</span>
                    <span>{invoice.route_name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Outlet Name:</span>
                    <span>{invoice.outlet_name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Brand:</span>
                    <span>{invoice.brand || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Linked Bill:</span>
                    <span>{invoice.linked_bill_id ? `#${invoice.linked_bill_id}` : "Deleted / unavailable"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Totals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax Amount:</span>
                    <span>{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount Amount:</span>
                    <span>{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold">
                    <span>Grand Total:</span>
                    <span className="text-[#6F72BE]">{formatCurrency(invoice.total_amount)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items table */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Items</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TableWrapper className="rounded-t-none border-0">
                  <Table>
                    <THead>
                      <tr>
                        <TH>Product Code</TH>
                        <TH>Product Name</TH>
                        <TH>Category</TH>
                        <TH>Description</TH>
                        <TH>Qty</TH>
                        <TH>Rate</TH>
                        <TH>Tax %</TH>
                        <TH>Tax Amt</TH>
                        <TH>Amount</TH>
                        <TH>Line Total</TH>
                      </tr>
                    </THead>
                    <TBody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-t border-gray-100">
                          <TD>{item.product_code || "—"}</TD>
                          <TD>{item.product_name || "—"}</TD>
                          <TD>{item.category || "—"}</TD>
                          <TD className="whitespace-normal break-words">{item.description || "—"}</TD>
                          <TD>{item.quantity}</TD>
                          <TD>{formatCurrency(item.rate)}</TD>
                          <TD>{item.tax_rate}%</TD>
                          <TD>{formatCurrency(item.tax_amount)}</TD>
                          <TD>{formatCurrency(item.amount)}</TD>
                          <TD className="font-medium">{formatCurrency(item.line_total)}</TD>
                        </tr>
                      ))}
                    </TBody>
                  </Table>
                </TableWrapper>
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Notes</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700">
                  {invoice.notes || "—"}
                </CardContent>
              </Card>
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Terms</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700">
                  {invoice.terms || "—"}
                </CardContent>
              </Card>
            </div>

            {/* Mobile bottom bar */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 p-3 backdrop-blur sm:hidden">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1 h-9 text-sm">Back</Button>
                <Button variant="outline" onClick={() => handleEdit(invoice.id)} className="flex-1 h-9 text-sm">Edit</Button>
                <Button onClick={() => void handlePrint()} className="flex-1 h-9 text-sm">Print</Button>
                <Button variant="outline" onClick={() => void handleDownloadPdf()} className="flex-1 h-9 text-sm">PDF</Button>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="flex-1 h-9 text-sm text-red-600">Delete</Button>
              </div>
            </div>
            <div className="h-16 sm:hidden" />
          </>
        )}

        <DeleteInvoiceDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          invoiceId={invoice?.id ?? null}
          onDeleted={handleDeleted}
        />
      </div>
    </AppShell>
  );
}