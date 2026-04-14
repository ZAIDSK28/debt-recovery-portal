import { useQuery } from "@tanstack/react-query";
import { getOutletsApi, getRoutesApi } from "@/api/routes.api";
import { queryKeys } from "@/hooks/queryKeys";

export function useRoutes() {
  return useQuery({
    queryKey: queryKeys.routes,
    queryFn: getRoutesApi,
  });
}

export function useOutlets(routeId?: number | null) {
  return useQuery({
    queryKey: queryKeys.outlets(routeId),
    queryFn: () => getOutletsApi(routeId ?? undefined),
    enabled: Boolean(routeId),
  });
}