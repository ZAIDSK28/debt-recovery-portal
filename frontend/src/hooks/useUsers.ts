import { useQuery } from "@tanstack/react-query";
import { getUsersApi } from "@/api/users.api";
import { queryKeys } from "@/hooks/queryKeys";

export function useUsers(role?: string) {
  return useQuery({
    queryKey: queryKeys.users(role),
    queryFn: () => getUsersApi(role),
  });
}