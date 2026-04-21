// src/pages/invoices/invoice-detail-page.tsx
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrapper, TBody, TD, TH, THead } from "@/components/ui/table";
import { downloadInvoicePdfApi, getPrintableInvoiceHtmlApi } from "@/api/invoices.api";
import { useInvoiceReport } from "@/hooks/useInvoices";
import { downloadBlob, formatCurrency, formatDate, getApiError } from "@/lib/utils";
import { ResponsiveTableSkeleton } from "@/components/common/loading-state";

export default function InvoiceDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const invoiceId = Number(params.id);
  const query = useInvoiceReport(invoiceId, Number.isFinite(invoiceId));

  async function handlePrint() {
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
  }

  async function handleDownloadPdf() {
    if (!Number.isFinite(invoiceId) || !query.data) return;

    try {
      const blob = await downloadInvoicePdfApi(invoiceId);
      downloadBlob(blob, `${query.data.invoice_number}.pdf`);
      toast.success("PDF download started");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

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
      <div className="space-y-4 sm:space-y-5">
        <PageHeader
          title={invoice ? `Invoice ${invoice.invoice_number}` : "Invoice Detail"}
          description="View printable invoice details and linked bill information."
          actions={
            <div className="hidden sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:gap-2">
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => navigate("/invoices")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
              {invoice ? (
                <>
                  <Button className="w-full sm:w-auto" onClick={() => void handlePrint()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button className="w-full sm:w-auto" variant="outline" onClick={() => void handleDownloadPdf()}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </>
              ) : null}
            </div>
          }
        />

        {query.isLoading ? (
          <ResponsiveTableSkeleton />
        ) : !invoice ? (
          <EmptyState title="Invoice not found" description="The requested invoice could not be loaded." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Header</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <p className="break-words"><span className="font-medium text-slate-900">Invoice Number:</span> {invoice.invoice_number}</p>
                  <p><span className="font-medium text-slate-900">Invoice Date:</span> {formatDate(invoice.invoice_date)}</p>
                  <p><span className="font-medium text-slate-900">Creation Mode:</span> {invoice.creation_mode.replaceAll("_", " ")}</p>
                  <p><span className="font-medium text-slate-900">Created At:</span> {formatDate(invoice.created_at)}</p>
                  <p>
                    <span className="font-medium text-slate-900">Linked Bill ID:</span>{" "}
                    {invoice.linked_bill_id ?? "—"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <p className="break-words"><span className="font-medium text-slate-900">Customer Name:</span> {invoice.customer_name}</p>
                  <p><span className="font-medium text-slate-900">Phone:</span> {invoice.customer_phone || "—"}</p>
                  <p className="break-words"><span className="font-medium text-slate-900">GST Number:</span> {invoice.gst_number || "—"}</p>
                  <p className="break-words"><span className="font-medium text-slate-900">Address:</span> {invoice.customer_address || "—"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bill Mapping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <p className="break-words"><span className="font-medium text-slate-900">Route Name:</span> {invoice.route_name || "—"}</p>
                  <p className="break-words"><span className="font-medium text-slate-900">Outlet Name:</span> {invoice.outlet_name || "—"}</p>
                  <p className="break-words"><span className="font-medium text-slate-900">Brand:</span> {invoice.brand || "—"}</p>
                  <p className="break-words">
                    <span className="font-medium text-slate-900">Linked Bill:</span>{" "}
                    {invoice.linked_bill_id ? `#${invoice.linked_bill_id}` : "Deleted / unavailable"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Totals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <p><span className="font-medium text-slate-900">Subtotal:</span> {formatCurrency(invoice.subtotal)}</p>
                  <p><span className="font-medium text-slate-900">Tax Amount:</span> {formatCurrency(invoice.tax_amount)}</p>
                  <p><span className="font-medium text-slate-900">Discount Amount:</span> {formatCurrency(invoice.discount_amount)}</p>
                  <p><span className="font-medium text-slate-900">Grand Total:</span> {formatCurrency(invoice.total_amount)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-5 pt-0">
                <TableWrapper className="w-full rounded-none border-0 shadow-none">
                  <Table className="min-w-full table-fixed">
                    <THead>
                      <tr>
                        <TH className="w-[46%]">Description</TH>
                        <TH className="w-[18%]">Quantity</TH>
                        <TH className="w-[18%]">Rate</TH>
                        <TH className="w-[18%]">Amount</TH>
                      </tr>
                    </THead>
                    <TBody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100 align-top">
                          <TD className="whitespace-normal break-words">{item.description}</TD>
                          <TD>{item.quantity}</TD>
                          <TD>{formatCurrency(item.rate)}</TD>
                          <TD className="font-medium">{formatCurrency(item.amount)}</TD>
                        </tr>
                      ))}
                    </TBody>
                  </Table>
                </TableWrapper>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">
                  {invoice.notes || "—"}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Terms</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">
                  {invoice.terms || "—"}
                </CardContent>
              </Card>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-2.5 backdrop-blur sm:hidden">
              <div className="mx-auto flex max-w-3xl gap-2">
                <Button className="flex-1" variant="outline" onClick={() => navigate("/invoices")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1" onClick={() => void handlePrint()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => void handleDownloadPdf()}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="h-16 sm:hidden" />
          </>
        )}
      </div>
    </AppShell>
  );
}