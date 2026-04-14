import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DailySummary } from "@/types";

export function DailyCollectionsChart({ data }: { data: DailySummary[] }) {
  const chartData = data.map((item) => ({
    ...item,
    label: formatDate(item.date),
    total:
      Number(item.cash_total) +
      Number(item.upi_total) +
      Number(item.cheque_total) +
      Number(item.electronic_total),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Collection Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number | string) => formatCurrency(Number(value))}
                labelFormatter={(_, payload) => {
                  const point = payload?.[0]?.payload as { label?: string; total?: number } | undefined;
                  return `${point?.label ?? ""} · Total ${formatCurrency(point?.total ?? 0)}`;
                }}
              />
              <Legend />
              <Bar dataKey="cash_total" name="Cash" fill="#10B981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="upi_total" name="UPI" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="cheque_total" name="Cheque" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              <Bar dataKey="electronic_total" name="Electronic" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}