import { useMemo, useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardDailyCollection } from "@/types";

const METHOD_SERIES = [
  { key: "cash_total", label: "Cash", color: "#22A55A" },
  { key: "upi_total", label: "UPI", color: "#6F72BE" },
  { key: "cheque_total", label: "Cheque", color: "#D97B0A" },
  { key: "electronic_total", label: "Electronic", color: "#E04E6A" },
] as const;

type MethodKey = (typeof METHOD_SERIES)[number]["key"];

const compactCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload as
    | (Record<string, string | number> & { total?: number })
    | undefined;

  if (!row) return null;

  const total = Number(row.total ?? 0);

  return (
    <div className="animate-in fade-in zoom-in-95 duration-200 rounded-2xl border border-[#E8EAF3] bg-white/95 backdrop-blur-sm px-4 py-3 shadow-[0_20px_35px_-12px_rgba(0,0,0,0.15)] transition-all">
      <p className="text-xs font-medium text-[#9898B4]">{String(label ?? "")}</p>
      <p className="mt-1 text-sm font-semibold text-[#1E1E30]">
        Total {formatCurrency(total)}
      </p>

      <div className="mt-3 space-y-1.5">
        {METHOD_SERIES.map((item) => {
          const value = Number(row[item.key] ?? 0);
          const percent = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={item.key} className="flex items-center justify-between gap-4 text-xs group">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-110"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[#6B6B86] group-hover:text-[#4A4A6A] transition-colors">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#1E1E30]">
                  {formatCurrency(value)}
                </span>
                <span className="text-[10px] text-[#A0A0C0] w-12 text-right">
                  ({percent.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DailyCollectionsChart({ data }: { data: DashboardDailyCollection[] }) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        label: formatDate(item.date),
        total: Number(item.total_collection),
      })),
    [data]
  );

  const summary = useMemo(() => {
    return chartData.reduce(
      (acc, item) => {
        acc.total += Number(item.total ?? 0);
        METHOD_SERIES.forEach(({ key }) => {
          acc[key] += Number(item[key] ?? 0);
        });
        acc.paymentCount += Number(item.payment_count ?? 0);
        acc.billsCleared += Number(item.bill_count_cleared ?? 0);
        return acc;
      },
      {
        total: 0,
        cash_total: 0,
        upi_total: 0,
        cheque_total: 0,
        electronic_total: 0,
        paymentCount: 0,
        billsCleared: 0,
      }
    );
  }, [chartData]);

  const latest = chartData.at(-1);

  // Animated bar widths for payment mix
  const [barWidths, setBarWidths] = useState<Record<MethodKey, number>>({
    cash_total: 0,
    upi_total: 0,
    cheque_total: 0,
    electronic_total: 0,
  });

  useEffect(() => {
    const newWidths = {} as Record<MethodKey, number>;
    METHOD_SERIES.forEach(({ key }) => {
      const value = summary[key];
      const percent = summary.total > 0 ? (value / summary.total) * 100 : 0;
      newWidths[key] = percent;
    });
    setBarWidths(newWidths);
  }, [summary]);

  return (
    <Card className="group/card overflow-hidden rounded-[28px] border border-[#EFF0F6] bg-white shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_20px_35px_-12px_rgba(0,0,0,0.12)]">
      <CardHeader className="border-b border-[#F0F1F7] bg-gradient-to-br from-white to-[#FBFBFE] px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight text-[#1A1A2E]">
              Daily Collection Summary
            </CardTitle>
            <p className="mt-1 text-[13px] text-[#9898B4]">
              Payment trends & method breakdown
            </p>
          </div>

          <div className="sm:min-w-[180px]">
            <div className="rounded-2xl border border-[#E8EAF3] bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-[#DFE1F0] hover:shadow-md">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9898B4]">
                Total Collection
              </p>
              <p className="mt-1 text-[22px] font-bold leading-none text-[#1E1E30] tracking-tight">
                {formatCurrency(summary.total)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_300px]">
          <div className="rounded-2xl border border-[#EFF0F6] bg-[#FCFCFF] p-4 transition-all duration-200 hover:border-[#E4E6F0]">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 14, right: 10, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="collectionsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6F72BE" stopOpacity={0.35} />
                      <stop offset="70%" stopColor="#6F72BE" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#6F72BE" stopOpacity={0.02} />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(223, 225, 240, 0.7)"
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={14}
                    tick={{ fontSize: 12, fill: "#9898B4", fontWeight: 500 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={74}
                    tickFormatter={(value) => compactCurrency.format(Number(value))}
                    tick={{ fontSize: 12, fill: "#9898B4" }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "#6F72BE", strokeWidth: 1.5, strokeDasharray: "4 4", opacity: 0.4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#6F72BE"
                    strokeWidth={3}
                    fill="url(#collectionsFill)"
                    animationDuration={1200}
                    animationEasing="ease-out"
                    isAnimationActive
                    dot={{
                      r: 4,
                      strokeWidth: 2.5,
                      stroke: "#6F72BE",
                      fill: "#ffffff",
                      fillOpacity: 1,
                    }}
                    activeDot={{
                      r: 7,
                      strokeWidth: 3,
                      stroke: "#6F72BE",
                      fill: "#ffffff",
                      filter: "url(#glow)",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8EAF3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#6B6B86] transition-all duration-200 hover:border-[#D0D2E0] hover:bg-[#FCFCFF] hover:shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6F72BE] animate-pulse" />
                Payments: {summary.paymentCount}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8EAF3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#6B6B86] transition-all duration-200 hover:border-[#D0D2E0] hover:bg-[#FCFCFF]">
                Bills cleared: {summary.billsCleared}
              </span>
              {latest ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8EAF3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#6B6B86] transition-all duration-200 hover:border-[#D0D2E0] hover:bg-[#FCFCFF]">
                  Updated: {latest.generated_at ? formatDate(latest.generated_at) : latest.label}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-[#EFF0F6] bg-white p-5 shadow-sm transition-all duration-200 hover:border-[#E4E6F0]">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9898B4]">
                Payment Mix
              </p>
              <p className="text-[13px] font-medium text-[#9898B4]">
                {formatCurrency(summary.total)}
              </p>
            </div>

            <div className="mt-5 space-y-5">
              {METHOD_SERIES.map((item) => {
                const value = summary[item.key];
                const percent = summary.total > 0 ? (value / summary.total) * 100 : 0;
                const currentWidth = barWidths[item.key];

                return (
                  <div key={item.key} className="group/method transition-all duration-200">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full transition-all duration-200 group-hover/method:scale-110"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[14px] font-medium text-[#1E1E30]">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[14px] font-semibold text-[#1E1E30]">
                          {formatCurrency(value)}
                        </span>
                        <span className="text-[11px] font-medium text-[#A0A0C0]">
                          ({percent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#F1F2FA]">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${currentWidth}%`,
                          backgroundColor: item.color,
                          transitionProperty: "width",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-[#F0F1F7]">
              <div className="flex justify-between text-[11px] text-[#9898B4]">
                <span>Transactions: {summary.paymentCount}</span>
                <span>Cleared bills: {summary.billsCleared}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}