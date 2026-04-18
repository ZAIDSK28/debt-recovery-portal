// src/pages/invoices/invoice-detail-page.tsx

import { ArrowLeft, Download, ExternalLink, Printer } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableWrapper, TBody, TD, TH, THead } from "@/components/ui/table";
import { downloadInvoicePdfApi, getPrintableInvoiceHtmlApi } from "@/api/invoices.api";
import { useInvoiceReport } from "@/hooks/useInvoices";
import { downloadBlob, formatCurrency, formatDate, getApiError } from "@/lib/utils";

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
      <div className="space-y-6">
        <PageHeader
          title={invoice ? `Invoice ${invoice.invoice_number}` : "Invoice Detail"}
          description="View printable invoice details and linked bill information."
          actions={
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate("/invoices")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
              {invoice ? (
                <>
                  <Button onClick={() => void handlePrint()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={() => void handleDownloadPdf()}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </>
              ) : null}
            </div>
          }
        />

        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !invoice ? (
          <EmptyState title="Invoice not found" description="The requested invoice could not be loaded." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Header</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p><span className="font-medium text-slate-900">Invoice Number:</span> {invoice.invoice_number}</p>
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
                <CardContent className="space-y-3 text-sm">
                  <p><span className="font-medium text-slate-900">Customer Name:</span> {invoice.customer_name}</p>
                  <p><span className="font-medium text-slate-900">Phone:</span> {invoice.customer_phone || "—"}</p>
                  <p><span className="font-medium text-slate-900">GST Number:</span> {invoice.gst_number || "—"}</p>
                  <p><span className="font-medium text-slate-900">Address:</span> {invoice.customer_address || "—"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bill Mapping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p><span className="font-medium text-slate-900">Route Name:</span> {invoice.route_name || "—"}</p>
                  <p><span className="font-medium text-slate-900">Outlet Name:</span> {invoice.outlet_name || "—"}</p>
                  <p><span className="font-medium text-slate-900">Brand:</span> {invoice.brand || "—"}</p>
                  {invoice.linked_bill_id ? (
                    <div className="pt-2">
                      <Link to="/admin" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
                        Open linked bill dashboard
                        <ExternalLink className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Totals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
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
              <CardContent>
                <TableWrapper className="rounded-xl">
                  <Table>
                    <THead>
                      <tr>
                        <TH>Description</TH>
                        <TH>Quantity</TH>
                        <TH>Rate</TH>
                        <TH>Amount</TH>
                      </tr>
                    </THead>
                    <TBody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100">
                          <TD>{item.description}</TD>
                          <TD>{item.quantity}</TD>
                          <TD>{formatCurrency(item.rate)}</TD>
                          <TD>{formatCurrency(item.amount)}</TD>
                        </tr>
                      ))}
                    </TBody>
                  </Table>
                </TableWrapper>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
          </>
        )}
      </div>
    </AppShell>
  );
}