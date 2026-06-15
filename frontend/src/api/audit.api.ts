// src/api/audit.api.ts
import { axiosInstance } from "@/api/axiosInstance";
import type { PaginatedResponse } from "@/types";

export interface AuditLog {
  id: number;
  actor_id: number | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  action?: string;
  entity_type?: string;
  actor_username?: string;
  start_date?: string;
  end_date?: string;
}

export async function getAuditLogsApi(
  params?: AuditLogsQueryParams
): Promise<PaginatedResponse<AuditLog>> {
  const { data } = await axiosInstance.get<PaginatedResponse<AuditLog>>("/core/audit-logs/", {
    params,
  });
  return data;
}