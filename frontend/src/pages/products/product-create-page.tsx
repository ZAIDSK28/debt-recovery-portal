// src/pages/products/product-create-page.tsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";

export default function ProductCreatePage() {
  const navigate = useNavigate();

  const handleBack = () => navigate("/products");

  return (
    <AppShell >
      <div className="space-y-5">
        <PageHeader
          title="Create Product"
          description="Add a new product for invoice-backed line item selection."
          actions={
            <Button variant="outline" onClick={handleBack} className="h-9 gap-1.5 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
          }
        />

        <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
          <ProductForm
            onSuccess={() => {
              navigate("/products", { replace: true });
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}