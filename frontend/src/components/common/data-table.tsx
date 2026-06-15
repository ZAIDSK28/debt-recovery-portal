// src/components/common/data-table.tsx
import React, { memo, useCallback, useMemo, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/common/data-table-pagination";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortKey?: string;
  render?: (row: T) => ReactNode;
  cellClassName?: string;
  headerClassName?: string;
}

type SortDir = "asc" | "desc";

function parseOrdering(ordering: string | undefined): { key: string; dir: SortDir } | null {
  if (!ordering) return null;
  if (ordering.startsWith("-")) return { key: ordering.slice(1), dir: "desc" };
  return { key: ordering, dir: "asc" };
}

function buildOrdering(key: string, dir: SortDir): string {
  return dir === "desc" ? `-${key}` : key;
}

function nextDir(current: SortDir | null): SortDir | null {
  if (current === null) return "asc";
  if (current === "asc") return "desc";
  return null;
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir | null }) {
  if (dir === "asc")  return <ArrowUp   className="ml-1 h-2.5 w-2.5 shrink-0 text-[#6F72BE]" />;
  if (dir === "desc") return <ArrowDown className="ml-1 h-2.5 w-2.5 shrink-0 text-[#6F72BE]" />;
  return (
    <ChevronsUpDown className="ml-1 h-2.5 w-2.5 shrink-0 text-[#9898B4] opacity-0 transition-opacity group-hover:opacity-100" />
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows({ cols, rows = 7 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-t border-[#DFE1F0]">
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-3 py-2">
              <Skeleton className="h-3.5 w-full max-w-[120px] rounded-[4px] bg-[#EAEBF8]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  ordering?: string;
  isLoading: boolean;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onSortChange: (ordering: string | undefined) => void;
  filters?: ReactNode;
  emptyState?: ReactNode;
  className?: string;
  minWidth?: number;
  rowKey?: (row: T) => string | number;
}

function DefaultEmptyState() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#EAEBF8]">
        <ChevronsUpDown className="h-4 w-4 text-[#9898B4]" />
      </div>
      <p className="text-[13px] font-medium text-[#1E1E30]">No records found</p>
      <p className="text-[11px] text-[#9898B4]">Try adjusting your filters or search term.</p>
    </div>
  );
}

export const DataTable = memo(<T extends object>({
  columns,
  data,
  total,
  page,
  pageSize,
  ordering,
  isLoading,
  isFetching = false,
  onPageChange,
  onSortChange,
  filters,
  emptyState,
  className,
  minWidth = 700,
  rowKey,
}: DataTableProps<T>) => {
  const parsed = useMemo(() => parseOrdering(ordering), [ordering]);

  const handleHeaderClick = useCallback((col: DataTableColumn<T>) => {
    if (!col.sortKey) return;
    const currentDir = parsed?.key === col.sortKey ? parsed.dir : null;
    const next = nextDir(currentDir);
    if (next === null) { onSortChange(undefined); } else { onSortChange(buildOrdering(col.sortKey, next)); }
    onPageChange(1);
  }, [parsed, onSortChange, onPageChange]);

  const showEmpty    = !isLoading && data.length === 0;
  const showSkeleton = isLoading;
  const showData     = !isLoading && data.length > 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[14px] border border-[#DFE1F0] bg-white",
        "shadow-[0_1px_6px_rgba(30,30,48,0.05)]",
        className,
      )}
    >
      {filters ? (
        <div className="border-b border-[#DFE1F0] bg-[#FAFBFE] px-3 py-2.5">{filters}</div>
      ) : null}

      {isFetching && !isLoading ? (
        <div className="flex items-center gap-1.5 border-b border-[#DFE1F0] bg-[#F6F7FC] px-3 py-1">
          <Loader2 className="h-2.5 w-2.5 animate-spin text-[#6F72BE]" />
          <span className="text-[10px] text-[#9898B4]">Updating…</span>
        </div>
      ) : null}

      {showEmpty ? (
        <div className="py-14 text-center">{emptyState ?? <DefaultEmptyState />}</div>
      ) : null}

      {(showSkeleton || showData) ? (
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth }}>
            <thead className="sticky top-0 z-[1] bg-[#F6F7FC]">
              <tr>
                {columns.map((col) => {
                  const isSorted = parsed !== null && parsed.key === col.sortKey;
                  const dir = isSorted ? parsed.dir : null;
                  const isSortable = Boolean(col.sortKey);
                  return (
                    <th
                      key={col.key}
                      onClick={isSortable ? () => handleHeaderClick(col) : undefined}
                      className={cn(
                        "group whitespace-nowrap border-b border-[#DFE1F0] px-3 py-2",
                        "text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-[#9898B4]",
                        isSortable && "cursor-pointer select-none hover:text-[#6F72BE]",
                        isSorted   && "text-[#6F72BE]",
                        col.headerClassName,
                      )}
                    >
                      <span className="inline-flex items-center">
                        {col.header}
                        {isSortable ? <SortIcon dir={dir} /> : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {showSkeleton ? (
                <SkeletonRows cols={columns.length} />
              ) : (
                data.map((row, ri) => {
                  const key = rowKey ? rowKey(row) : ri;
                  return (
                    <tr
                      key={key}
                      className="border-t border-[#DFE1F0] transition-colors hover:bg-[#F6F7FC]"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "whitespace-nowrap px-3 py-2 text-[12.5px] text-[#1E1E30]",
                            col.cellClassName,
                          )}
                        >
                          {col.render
                            ? col.render(row)
                            : String((row as Record<string, unknown>)[col.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {showData ? (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
}) as <T extends object>(props: DataTableProps<T>) => React.ReactElement;