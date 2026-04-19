import { Skeleton } from "@/components/ui/skeleton";

export function MobileCardsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-3 lg:hidden">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full rounded-[20px]" />
      ))}
    </div>
  );
}

export function DesktopTableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="hidden space-y-3 lg:block">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function ResponsiveTableSkeleton({
  mobileCount = 2,
  desktopRows = 3,
}: {
  mobileCount?: number;
  desktopRows?: number;
}) {
  return (
    <div className="space-y-3">
      <MobileCardsSkeleton count={mobileCount} />
      <DesktopTableSkeleton rows={desktopRows} />
    </div>
  );
}