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
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3">
          <Icon className="h-6 w-6 text-slate-700" />
        </div>
      </CardContent>
    </Card>
  );
}