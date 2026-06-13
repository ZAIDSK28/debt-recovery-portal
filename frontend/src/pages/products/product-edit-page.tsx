// src/pages/products/product-edit-page.tsx
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ResponsiveTableSkeleton } from "@/components/common/loading-state";
import { ProductForm } from "@/components/products/product-form";
import { useProduct } from "@/hooks/useProducts";

export default function ProductEditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const productId = Number(params.id);
  const query = useProduct(productId, Number.isFinite(productId));

  const handleBack = () => navigate("/products");

  if (!Number.isFinite(productId)) {
    return (
      <AppShell >
        <EmptyState title="Invalid product" description="The requested product id is invalid." />
      </AppShell>
    );
  }

  return (
    <AppShell >
      <div className="space-y-5">
        <PageHeader
          title="Edit Product"
          description="Update product information used during invoice creation."
          actions={
            <Button variant="outline" onClick={handleBack} className="h-9 gap-1.5 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
          }
        />

        {query.isLoading ? (
          <ResponsiveTableSkeleton />
        ) : !query.data ? (
          <EmptyState title="Product not found" description="The requested product could not be loaded." />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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