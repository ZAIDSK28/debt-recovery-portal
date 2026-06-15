// src/hooks/useAuditLogs.ts
import { useQuery } from "@tanstack/react-query";
import { getAuditLogsApi, type AuditLogsQueryParams } from "@/api/audit.api";

export function useAuditLogs(params: AuditLogsQueryParams) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => getAuditLogsApi(params),
    placeholderData: (prev) => prev,
  });
}