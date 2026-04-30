// src/components/common/data-table-pagination.tsx
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const { totalPages, canGoPrevious, canGoNext } = useMemo(() => {
    const resolvedTotalPages = Math.max(1, Math.ceil(total / pageSize));
    return {
      totalPages: resolvedTotalPages,
      canGoPrevious: page > 1,
      canGoNext: page < resolvedTotalPages,
    };
  }, [page, pageSize, total]);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages} · {total} records
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={!canGoPrevious}>
          <ChevronLeft className="mr-1 h-3.5 w-3.5" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
        >
          Next
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}