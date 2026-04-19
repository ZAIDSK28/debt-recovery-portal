import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
  title,
  value,
  icon: Icon,
  accentClassName,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  accentClassName: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClassName}`} />
      <CardContent className="flex items-center justify-between px-4 py-4 sm:px-5 sm:py-4.5 lg:px-5">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{title}</p>
          <p className="mt-1.5 break-words text-2xl font-bold tracking-tight text-sky-950 sm:text-[28px]">{value}</p>
        </div>
        <div className="ml-3 rounded-2xl bg-sky-50 p-2 text-sky-700 sm:p-2.5">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}