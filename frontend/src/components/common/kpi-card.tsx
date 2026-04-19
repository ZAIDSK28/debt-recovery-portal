// src/components/common/kpi-card.tsx

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
      <div className={`absolute left-0 top-0 h-full w-1.5 ${accentClassName}`} />
      <CardContent className="flex items-center justify-between p-4 sm:p-5 lg:p-6">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 break-words text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>
        </div>
        <div className="ml-3 rounded-2xl bg-slate-100 p-2.5 sm:p-3">
          <Icon className="h-5 w-5 text-slate-700 sm:h-6 sm:w-6" />
        </div>
      </CardContent>
    </Card>
  );
}