import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { downloadInvoicePdfApi, getPrintableInvoiceHtmlApi } from "@/api/invoices.api";
import { toast } from "sonner";
import { downloadBlob, getApiError } from "@/lib/utils";

export default function CreateInvoicePage() {
  const navigate = useNavigate();

  async function handleCreated(invoiceId: number) {
    navigate(`/invoices/${invoiceId}`, { replace: true });
  }

  async function handleCreatedAndView(invoiceId: number, invoiceNumber: string) {
    try {
      const html = await getPrintableInvoiceHtmlApi(invoiceId);
      const printWindow = window.open("", "_blank", "width=1024,height=768");

      if (!printWindow) {
        const blob = await downloadInvoicePdfApi(invoiceId);
        downloadBlob(blob, `${invoiceNumber}.pdf`);
        navigate(`/invoices/${invoiceId}`, { replace: true });
        return;
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      printWindow.onload = () => {
        printWindow.print();
      };

      navigate(`/invoices/${invoiceId}`, { replace: true });
    } catch (error) {
      toast.error(getApiError(error));
      navigate(`/invoices/${invoiceId}`, { replace: true });
    }
  }

  return (
    <AppShell title="Create Invoice">
      <div className="space-y-5">
        <PageHeader
          title="Create Invoice"
          description="Create a printable invoice and optionally generate a dashboard bill."
        />

        <InvoiceForm
          onCreated={(invoice) => {
            void handleCreated(invoice.id);
          }}
          onCreatedAndView={(invoice) => {
            void handleCreatedAndView(invoice.id, invoice.invoice_number);
          }}
        />
      </div>
    </AppShell>
  );
}