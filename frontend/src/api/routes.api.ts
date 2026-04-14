import { axiosInstance } from "@/api/axiosInstance";
import type { Outlet, PaginatedResponse, Route } from "@/types";

export async function getRoutesApi(): Promise<Route[]> {
  const { data } = await axiosInstance.get<Route[] | PaginatedResponse<Route>>("/routes/");
  return Array.isArray(data) ? data : data.results;
}

export async function getOutletsApi(routeId?: number): Promise<Outlet[]> {
  const { data } = await axiosInstance.get<Outlet[] | PaginatedResponse<Outlet>>("/outlets/", {
    params: routeId ? { route_id: routeId } : undefined,
  });
  return Array.isArray(data) ? data : data.results;
}