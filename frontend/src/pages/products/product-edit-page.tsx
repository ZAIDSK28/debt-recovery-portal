// src/pages/products/product-edit-page.tsx
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveTableSkeleton } from "@/components/common/loading-state";
import { ProductForm } from "@/components/products/product-form";
import { useProduct } from "@/hooks/useProducts";

export default function ProductEditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const productId = Number(params.id);
  const query = useProduct(productId, Number.isFinite(productId));

  if (!Number.isFinite(productId)) {
    return (
      <AppShell title="Edit Product">
        <EmptyState title="Invalid product" description="The requested product id is invalid." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit Product">
      <div className="space-y-5">
        <PageHeader
          title="Edit Product"
          description="Update product information used during invoice creation."
        />

        {query.isLoading ? (
          <ResponsiveTableSkeleton />
        ) : !query.data ? (
          <EmptyState title="Product not found" description="The requested product could not be loaded." />
        ) : (
          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <ProductForm
              product={query.data}
              onSuccess={() => {
                navigate("/products", { replace: true });
              }}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}