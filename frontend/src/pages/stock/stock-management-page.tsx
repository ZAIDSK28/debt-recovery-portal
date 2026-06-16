// src/pages/stock/stock-management-page.tsx
import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeftRight, Package, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { StockMovementFormModal } from "@/components/stock/stock-movement-form-modal";
import { StockTransferFormModal } from "@/components/stock/stock-transfer-form-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeFilter } from "@/components/common/date-range-filter";
import { useDebounce } from "@/hooks/useDebounce";
import { useStockItems, useStockMovements, useStockTransfers, useWarehouses } from "@/hooks/useProducts";
import { cn, formatDate } from "@/lib/utils";
import type { StockItem, StockMovement, StockTransfer, StockMovementType } from "@/types";

type Tab = "levels" | "movements" | "transfers";
const TABS: { id: Tab; label: string }[] = [
  { id: "levels", label: "Stock Levels" },
  { id: "movements", label: "Movements" },
  { id: "transfers", label: "Transfers" },
];

function MovementTypeBadge({ type }: { type: StockMovementType }) {
  if (type === "in") return <Badge variant="success">IN</Badge>;
  if (type === "out") return <Badge variant="danger">OUT</Badge>;
  return <Badge variant="warning">ADJ</Badge>;
}

// ─── Stock Levels Tab ─────────────────────────────────────────────────────────
const stockLevelColumns: DataTableColumn<StockItem>[] = [
  { key: "product_code", header: "Code", sortKey: "product__product_code", render: (r) => <span className="font-mono text-[12px] font-semibold text-[#6F72BE]">{r.product_code}</span> },
  { key: "product_name", header: "Product", sortKey: "product__name", render: (r) => <span className="font-medium text-[#1E1E30]">{r.product_name}</span> },
  { key: "category_name", header: "Category", render: (r) => <span className="text-[#6B6B8A]">{r.category_name ?? "—"}</span> },
  { key: "warehouse_name", header: "Warehouse", sortKey: "warehouse__name" },
  { key: "quantity", header: "On Hand", sortKey: "quantity", render: (r) => <span className={cn("font-semibold tabular-nums", r.is_low_stock ? "text-[#E04E6A]" : "text-[#1E1E30]")}>{r.quantity}</span> },
  { key: "reorder_level", header: "Reorder At", sortKey: "reorder_level", render: (r) => <span className="tabular-nums text-[#6B6B8A]">{r.reorder_level}</span> },
  { key: "is_low_stock", header: "Status", render: (r) => r.is_low_stock ? <Badge variant="danger"><AlertTriangle className="mr-1 h-2.5 w-2.5" />Low</Badge> : <Badge variant="success">OK</Badge> },
  { key: "updated_at", header: "Last Updated", sortKey: "updated_at", render: (r) => <span className="text-[12px] text-[#9898B4]">{formatDate(r.updated_at)}</span> },
];

function StockLevelsTab({ onRecordMovement }: { onRecordMovement: () => void }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [ordering, setOrdering] = useState<string | undefined>("-updated_at");
  const debouncedSearch = useDebounce(search, 400);
  const { data: warehouses = [] } = useWarehouses();
  const params = useMemo(() => ({ page, page_size: pageSize, search: debouncedSearch || undefined, warehouse_id: warehouseId !== "all" ? Number(warehouseId) : undefined, ordering }), [page, pageSize, debouncedSearch, warehouseId, ordering]);
  const query = useStockItems(params);
  const handleSortChange = useCallback((ord: string | undefined) => { setOrdering(ord); setPage(1); }, []);

  return (
    <DataTable
      columns={stockLevelColumns}
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
      minWidth={860}
      filters={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1"><SearchInput placeholder="Search product, code, or warehouse…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
          <div className="w-full sm:w-52">
            <Select value={warehouseId} onValueChange={(v) => { setWarehouseId(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All warehouses" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All warehouses</SelectItem>{warehouses.map((w) => (<SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
      }
      emptyState={
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No stock records found"
          description="Stock records appear when the first movement for a product-warehouse pair is recorded."
          action={
            <Button onClick={onRecordMovement}>
              <Plus className="mr-2 h-4 w-4" />
              Record Movement
            </Button>
          }
        />
      }
    />
  );
}

// ─── Movements Tab ────────────────────────────────────────────────────────────
const movementColumns: DataTableColumn<StockMovement>[] = [
  { key: "created_at", header: "Date", sortKey: "created_at", render: (r) => <span className="text-[12px] text-[#9898B4]">{formatDate(r.created_at)}</span> },
  { key: "product_name", header: "Product", sortKey: "product__name", render: (r) => <span className="font-medium text-[#1E1E30]">{r.product_name}</span> },
  { key: "warehouse_name", header: "Warehouse", sortKey: "warehouse__name" },
  { key: "movement_type", header: "Type", render: (r) => <MovementTypeBadge type={r.movement_type} /> },
  { key: "quantity", header: "Quantity", sortKey: "quantity", render: (r) => <span className="font-semibold tabular-nums">{r.quantity}</span> },
  { key: "note", header: "Note", cellClassName: "max-w-[200px] truncate text-[#6B6B8A]", render: (r) => r.note || "—" },
];

function StockMovementsTab() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState<string>("all");
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [ordering, setOrdering] = useState<string | undefined>("-created_at");
  const debouncedSearch = useDebounce(search, 400);
  const { data: warehouses = [] } = useWarehouses();

  const params = useMemo(() => ({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    movement_type: movementType !== "all" ? (movementType as StockMovementType) : undefined,
    warehouse_id: warehouseId !== "all" ? Number(warehouseId) : undefined,
    start_date: filterStartDate || undefined,
    end_date: filterEndDate || undefined,
    ordering,
  }), [page, pageSize, debouncedSearch, movementType, warehouseId, filterStartDate, filterEndDate, ordering]);

  const query = useStockMovements(params);
  const handleSortChange = useCallback((ord: string | undefined) => { setOrdering(ord); setPage(1); }, []);

  return (
    <DataTable
      columns={movementColumns}
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
      minWidth={860}
      filters={
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[180px]"><SearchInput placeholder="Search product or note…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
            <div className="w-44"><Select value={movementType} onValueChange={(v) => { setMovementType(v); setPage(1); }}><SelectTrigger><SelectValue placeholder="Movement type" /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="in">IN</SelectItem><SelectItem value="out">OUT</SelectItem><SelectItem value="adjustment">ADJUSTMENT</SelectItem></SelectContent></Select></div>
            <div className="w-52"><Select value={warehouseId} onValueChange={(v) => { setWarehouseId(v); setPage(1); }}><SelectTrigger><SelectValue placeholder="All warehouses" /></SelectTrigger><SelectContent><SelectItem value="all">All warehouses</SelectItem>{warehouses.map((w) => (<SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>))}</SelectContent></Select></div>
            <DateRangeFilter startDate={filterStartDate} endDate={filterEndDate} onStartDateChange={(v) => { setFilterStartDate(v); setPage(1); }} onEndDateChange={(v) => { setFilterEndDate(v); setPage(1); }} onClear={() => { setFilterStartDate(""); setFilterEndDate(""); setPage(1); }} />
          </div>
        </div>
      }
      emptyState={
        <EmptyState
          icon={<TrendingUp className="h-6 w-6" />}
          title="No movements found"
          description="Record the first IN, OUT, or ADJUSTMENT to start tracking stock changes."
        />
      }
    />
  );
}

// ─── Transfers Tab ────────────────────────────────────────────────────────────
const transferColumns: DataTableColumn<StockTransfer>[] = [
  { key: "created_at", header: "Date", sortKey: "created_at", render: (r) => <span className="text-[12px] text-[#9898B4]">{formatDate(r.created_at)}</span> },
  { key: "product_name", header: "Product", render: (r) => <div><p className="font-medium text-[#1E1E30]">{r.product_name}</p><p className="font-mono text-[11px] text-[#9898B4]">{r.product_code}</p></div> },
  { key: "source_warehouse_name", header: "From", render: (r) => <div className="flex items-center gap-1.5 text-[#E04E6A]"><TrendingDown className="h-3.5 w-3.5 shrink-0" />{r.source_warehouse_name}</div> },
  { key: "destination_warehouse_name", header: "To", render: (r) => <div className="flex items-center gap-1.5 text-[#22A55A]"><TrendingUp className="h-3.5 w-3.5 shrink-0" />{r.destination_warehouse_name}</div> },
  { key: "quantity", header: "Quantity", sortKey: "quantity", render: (r) => <span className="font-semibold tabular-nums">{r.quantity}</span> },
  { key: "note", header: "Note", cellClassName: "max-w-[180px] truncate text-[#6B6B8A]", render: (r) => r.note || "—" },
  { key: "created_by_username", header: "By", render: (r) => <span className="text-[12px] text-[#9898B4]">{r.created_by_username || "—"}</span> },
];

function StockTransfersTab({ onNewTransfer }: { onNewTransfer: () => void }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [ordering, setOrdering] = useState<string | undefined>("-created_at");
  const debouncedSearch = useDebounce(search, 400);
  const params = useMemo(() => ({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    start_date: filterStartDate || undefined,
    end_date: filterEndDate || undefined,
    ordering,
  }), [page, pageSize, debouncedSearch, filterStartDate, filterEndDate, ordering]);
  const query = useStockTransfers(params);
  const handleSortChange = useCallback((ord: string | undefined) => { setOrdering(ord); setPage(1); }, []);

  return (
    <DataTable
      columns={transferColumns}
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
      minWidth={920}
      filters={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1"><SearchInput placeholder="Search product, warehouse, or note…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
          <DateRangeFilter startDate={filterStartDate} endDate={filterEndDate} onStartDateChange={(v) => { setFilterStartDate(v); setPage(1); }} onEndDateChange={(v) => { setFilterEndDate(v); setPage(1); }} onClear={() => { setFilterStartDate(""); setFilterEndDate(""); setPage(1); }} />
        </div>
      }
      emptyState={
        <EmptyState
          icon={<ArrowLeftRight className="h-6 w-6" />}
          title="No transfers recorded"
          description="Transfers move stock atomically between warehouses with full audit trail."
          action={
            <Button onClick={onNewTransfer}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              New Transfer
            </Button>
          }
        />
      }
    />
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StockManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("levels");
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const actionButton = useMemo(() => {
    if (activeTab === "movements") return null;
    if (activeTab === "transfers") {
      return (
        <Button onClick={() => setTransferModalOpen(true)}>
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          New Transfer
        </Button>
      );
    }
    return (
      <Button onClick={() => setMovementModalOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Record Movement
      </Button>
    );
  }, [activeTab]);

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          title="Stock / Warehousing"
          description="Track on-hand quantities, record movements, and transfer stock between warehouses."
          // No actions here – we place the button next to the tabs below
        />

        {/* Tabs + Action Button – inline */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-fit gap-1 rounded-[14px] border border-[#DFE1F0] bg-[#F6F7FC] p-1 shadow-[0_2px_8px_rgba(30,30,48,0.06)]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-[10px] px-4 py-1.5 text-[13px] font-semibold transition-all",
                  activeTab === tab.id
                    ? "bg-white text-[#6F72BE] shadow-[0_2px_8px_rgba(30,30,48,0.06)]"
                    : "text-[#9898B4] hover:text-[#6F72BE]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {actionButton && <div className="shrink-0">{actionButton}</div>}
        </div>

        {activeTab === "levels" && <StockLevelsTab onRecordMovement={() => setMovementModalOpen(true)} />}
        {activeTab === "movements" && <StockMovementsTab />}
        {activeTab === "transfers" && <StockTransfersTab onNewTransfer={() => setTransferModalOpen(true)} />}
      </div>

      {/* Modals */}
      <StockMovementFormModal open={movementModalOpen} onOpenChange={setMovementModalOpen} />
      <StockTransferFormModal open={transferModalOpen} onOpenChange={setTransferModalOpen} />
    </AppShell>
  );
}