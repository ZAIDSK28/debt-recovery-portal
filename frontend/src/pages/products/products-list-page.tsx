// src/pages/products/products-list-page.tsx
import { useMemo, useState } from "react";
import { Edit3, Package, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { ResponsiveTableSkeleton } from "@/components/common/loading-state";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Table, TableWrapper, TBody, TD, TH, THead } from "@/components/ui/table";
import { useDebounce } from "@/hooks/useDebounce";
import { useDeleteProduct, useProducts } from "@/hooks/useProducts";
import { formatCurrency, formatDate, getApiError } from "@/lib/utils";

export default function ProductsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const deleteMutation = useDeleteProduct();

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debouncedSearch || undefined,
    }),
    [page, pageSize, debouncedSearch]
  );

  const query = useProducts(params);
  const rows = query.data?.results ?? [];

  async function handleDelete(id: number) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Product deleted");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <AppShell title="Products">
      <div className="space-y-5">
        <PageHeader
          title="Products"
          description="Manage products used in printable invoice creation."
          actions={
            <Button className="w-full sm:w-auto" onClick={() => navigate("/products/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Product
            </Button>
          }
        />

        <div className="rounded-[18px] border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="w-full max-w-sm">
            <SearchInput
              placeholder="Search by code, name, or category..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {query.isLoading ? (
          <ResponsiveTableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="No products found"
            description="Create a product to start using product-backed invoice items."
            action={
              <Button onClick={() => navigate("/products/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Product
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
            <TableWrapper className="w-full rounded-none border-0 shadow-none">
              <Table className="w-full min-w-[1180px] table-auto">
                <THead>
                  <tr>
                    <TH>Product Code</TH>
                    <TH>Name</TH>
                    <TH>Category</TH>
                    <TH>Price</TH>
                    <TH>Default Quantity</TH>
                    <TH>Tax Rate</TH>
                    <TH>Status</TH>
                    <TH>Created At</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <TBody>
                  {rows.map((product) => (
                    <tr key={product.id} className="border-t border-slate-100 hover:bg-sky-50">
                      <TD className="font-medium text-slate-900">{product.product_code}</TD>
                      <TD>{product.name}</TD>
                      <TD>{product.category}</TD>
                      <TD>{formatCurrency(product.price)}</TD>
                      <TD>{product.default_quantity}</TD>
                      <TD>{product.tax_rate}%</TD>
                      <TD>{product.is_active ? "Active" : "Inactive"}</TD>
                      <TD>{formatDate(product.created_at)}</TD>
                      <TD className="whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/products/${product.id}/edit`)}>
                            <Edit3 className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => void handleDelete(product.id)}>
                            <Trash2 className="mr-1 h-3.5 w-3.5 text-red-500" />
                            Delete
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