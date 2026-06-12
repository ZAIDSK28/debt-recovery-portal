// src/api/parties.api.ts
import { axiosInstance } from "@/api/axiosInstance";
import type { PaginatedResponse } from "@/types";

export interface Party {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  gst_number: string;
  is_active: boolean;
  created_at: string;
}

export interface PartyQueryParams {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface CreatePartyPayload {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
  is_active?: boolean;
}

export interface UpdatePartyPayload extends Partial<CreatePartyPayload> {}

export async function getPartiesApi(params?: PartyQueryParams): Promise<Party[]> {
  const { data } = await axiosInstance.get<Party[] | PaginatedResponse<Party>>("/reports/parties/", { params });
  return Array.isArray(data) ? data : data.results;
}

export async function createPartyApi(payload: CreatePartyPayload): Promise<Party> {
  const { data } = await axiosInstance.post<Party>("/reports/parties/", payload);
  return data;
}

export async function getPartyByIdApi(id: number): Promise<Party> {
  const { data } = await axiosInstance.get<Party>(`/reports/parties/${id}/`);
  return data;
}

export async function updatePartyApi(id: number, payload: UpdatePartyPayload): Promise<Party> {
  const { data } = await axiosInstance.patch<Party>(`/reports/parties/${id}/`, payload);
  return data;
}