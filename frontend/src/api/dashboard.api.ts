// src/api/dashboard.api.ts
import { axiosInstance } from "@/api/axiosInstance";
import type { DashboardDailyCollection, DashboardSummary } from "@/types";

export async function getDashboardSummaryApi(days = 30): Promise<DashboardSummary> {
  const { data } = await axiosInstance.get<DashboardSummary>("/dashboard/summary/", {
    params: { days },
  });
  return data;
}

export async function getDashboardDailyCollectionsApi(days = 30): Promise<DashboardDailyCollection[]> {
  const { data } = await axiosInstance.get<DashboardDailyCollection[]>("/dashboard/daily-collections/", {
    params: { days },
  });
  return data;
}

export async function rebuildDashboardDailyCollectionsApi(days = 30): Promise<DashboardDailyCollection[]> {
  const { data } = await axiosInstance.post<DashboardDailyCollection[]>(
    "/dashboard/rebuild-daily-collections/",
    { days }
  );
  return data;
}