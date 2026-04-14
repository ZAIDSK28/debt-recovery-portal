import { useQuery } from "@tanstack/react-query";
import { getDailySummaryApi, getTodayTotalsApi } from "@/api/payments.api";
import { queryKeys } from "@/hooks/queryKeys";

export function useTodayTotals() {
  return useQuery({
    queryKey: queryKeys.todayTotals,
    queryFn: getTodayTotalsApi,
  });
}

export function useDailySummary(days = 30) {
  return useQuery({
    queryKey: queryKeys.dailySummary(days),
    queryFn: () => getDailySummaryApi(days),
  });
}