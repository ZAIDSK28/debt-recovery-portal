import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[10px] bg-[#E3E5F4]",
        className
      )}
    />
  );
}