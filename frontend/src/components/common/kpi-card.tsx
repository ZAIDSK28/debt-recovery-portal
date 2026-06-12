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
    <Card
      className="
        relative
        overflow-hidden
        rounded-[18px]
        border
        border-[#DFE1F0]
        bg-white
        shadow-[0_2px_8px_rgba(30,30,48,0.06)]
        transition-all
        duration-200
        hover:shadow-[0_4px_12px_rgba(30,30,48,0.08)]
      "
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClassName}`} />

      <CardContent className="flex items-center justify-between p-4 lg:px-5 lg:py-5">
        <div className="min-w-0">
          <p
            className="
              text-[11px]
              font-medium
              uppercase
              tracking-[0.08em]
              text-[#9898B4]
            "
          >
            {title}
          </p>

          <p
            className="
              mt-2
              break-words
              text-[28px]
              font-semibold
              leading-none
              tracking-tight
              text-[#1E1E30]
            "
          >
            {value}
          </p>
        </div>

        <div
          className="
            ml-4
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-[14px]
            border
            border-[#DFE1F0]
            bg-[#EAEBF8]
            text-[#6F72BE]
          "
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}