// src/hooks/useDashboard.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDashboardDailyCollectionsApi,
  getDashboardSummaryApi,
  rebuildDashboardDailyCollectionsApi,
} from "@/api/dashboard.api";
import { queryKeys } from "@/hooks/queryKeys";

export function useDashboardSummary(days = 30) {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(days),
    queryFn: () => getDashboardSummaryApi(days),
  });
}

export function useDashboardDailyCollections(days = 30) {
  return useQuery({
    queryKey: queryKeys.dashboardDailyCollections(days),
    queryFn: () => getDashboardDailyCollectionsApi(days),
  });
}

export function useRebuildDashboardDailyCollections(days = 30) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => rebuildDashboardDailyCollectionsApi(days),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.dashboardDailyCollections(days), data);
      void queryClient.invalidateQueries({ queryKey: [queryKeys.dashboardSummary(days)[0]] });
    },
  });
}