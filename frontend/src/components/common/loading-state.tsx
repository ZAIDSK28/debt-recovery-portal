// src/components/common/loading-state.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function MobileCardsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-3 lg:hidden">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-4 w-48 rounded-md" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DesktopTableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, idx) => (
            <Skeleton key={idx} className="h-4 flex-1 rounded" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((_, idx) => (
              <Skeleton key={idx} className="h-5 flex-1 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResponsiveTableSkeleton({
  mobileCount = 2,
  desktopRows = 5,
  desktopColumns = 4,
}: {
  mobileCount?: number;
  desktopRows?: number;
  desktopColumns?: number;
}) {
  return (
    <>
      <MobileCardsSkeleton count={mobileCount} />
      <DesktopTableSkeleton rows={desktopRows} columns={desktopColumns} />
    </>
  );
}