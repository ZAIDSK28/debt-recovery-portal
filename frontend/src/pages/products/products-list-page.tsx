// src/pages/products/products-list-page.tsx
import { useCallback, useMemo, useState } from "react";
import { Edit3, Package, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/lib/toast";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { useDeleteProduct, useProducts } from "@/hooks/useProducts";
import { formatCurrency, formatDate, getApiError } from "@/lib/utils";
import type { Product } from "@/types";

export default function ProductsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState<string | undefined>("name");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 400);
  const deleteMutation = useDeleteProduct();

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debouncedSearch || undefined,
      ordering,
      is_active: isActiveFilter === "all" ? undefined : isActiveFilter === "active",
    }),
    [page, pageSize, debouncedSearch, ordering, isActiveFilter],
  );

  const query = useProducts(params);

  const handleSortChange = useCallback((ord: string | undefined) => {
    setOrdering(ord);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!window.confirm("Delete this product? This cannot be undone.")) return;
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Product deleted");
      } catch (err) {
        toast.error(getApiError(err));
      }
    },
    [deleteMutation],
  );

  const columns: DataTableColumn<Product>[] = [
    {
      key: "product_code",
      header: "Code",
      sortKey: "product_code",
      render: (r) => (
        <span className="font-mono text-[11.5px] font-semibold text-[#6F72BE]">
          {r.product_code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortKey: "name",
      render: (r) => <span className="font-medium text-[#1E1E30]">{r.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      sortKey: "category",
      render: (r) => <span className="text-[#6B6B8A]">{r.category_name || r.category || "—"}</span>,
    },
    {
      key: "price",
      header: "Price",
      sortKey: "price",
      render: (r) => <span className="tabular-nums">{formatCurrency(r.price)}</span>,
    },
    {
      key: "default_quantity",
      header: "Qty",
      render: (r) => <span className="tabular-nums text-[#6B6B8A]">{r.default_quantity}</span>,
    },
    {
      key: "tax_rate",
      header: "Tax %",
      sortKey: "tax_rate",
      render: (r) => <span className="tabular-nums text-[#9898B4]">{r.tax_rate}%</span>,
    },
    {
      key: "is_active",
      header: "Status",
      render: (r) =>
        r.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="danger">Inactive</Badge>
        ),
    },
    {
      key: "created_at",
      header: "Created",
      sortKey: "created_at",
      render: (r) => <span className="text-[#9898B4]">{formatDate(r.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-[72px]",
      cellClassName: "w-[72px]",
      render: (r) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            title="Edit"
            onClick={() => navigate(`/products/${r.id}/edit`)}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            onClick={() => void handleDelete(r.id)}
            className="text-[#9898B4] hover:bg-[#FDEEF1] hover:text-[#E04E6A]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell >
      <div className="space-y-4">
        <PageHeader
          title="Products"
          description="Manage products used in printable invoice creation."
          actions={
            <Button onClick={() => navigate("/products/new")}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Product
            </Button>
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
          minWidth={960}
          filters={
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by code, name, or category…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="w-36">
                <Select
                  value={isActiveFilter}
                  onValueChange={(v) => { setIsActiveFilter(v); setPage(1); }}
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
          emptyState={
            <EmptyState
              icon={<Package className="h-5 w-5" />}
              title="No products found"
              description="Create a product to start using product-backed invoice items."
              action={
                <Button onClick={() => navigate("/products/new")}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  New Product
                </Button>
              }
            />
          }
        />
      </div>
    </AppShell>
  );
}