// src/pages/products/product-create-page.tsx
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { ProductForm } from "@/components/products/product-form";

export default function ProductCreatePage() {
  const navigate = useNavigate();

  return (
    <AppShell title="Create Product">
      <div className="space-y-5">
        <PageHeader
          title="Create Product"
          description="Add a new product for invoice-backed line item selection."
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