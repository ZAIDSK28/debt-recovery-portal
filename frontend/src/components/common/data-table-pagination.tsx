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
    const tp = Math.max(1, Math.ceil(total / pageSize));
    return { totalPages: tp, canGoPrevious: page > 1, canGoNext: page < tp };
  }, [page, pageSize, total]);

  return (
    <div className="flex items-center justify-between border-t border-[#DFE1F0] px-3 py-2">
      <p className="text-[11px] text-[#9898B4]">
        Page {page} of {totalPages}
        <span className="mx-1.5 text-[#DFE1F0]">·</span>
        <span className="text-[#6B6B8A]">{total} records</span>
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="mr-1 h-3 w-3" />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
        >
          Next
          <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}