// src/api/users.api.ts
import { axiosInstance } from "@/api/axiosInstance";
import type {
  CreateUserPayload,
  PaginatedResponse,
  SetUserPasswordPayload,
  UpdateUserPayload,
  User,
} from "@/types";

export async function getUsersApi(role?: string): Promise<User[]> {
  const { data } = await axiosInstance.get<User[] | PaginatedResponse<User>>("/auth/users/", {
    params: role ? { role } : undefined,
  });
  return Array.isArray(data) ? data : data.results;
}

export async function createUserApi(payload: CreateUserPayload): Promise<User> {
  const { data } = await axiosInstance.post<User>("/auth/users/", payload);
  return data;
}

export async function getUserByIdApi(id: number): Promise<User> {
  const { data } = await axiosInstance.get<User>(`/auth/users/${id}/`);
  return data;
}

export async function updateUserApi(id: number, payload: UpdateUserPayload): Promise<User> {
  const { data } = await axiosInstance.patch<User>(`/auth/users/${id}/`, payload);
  return data;
}

export async function setUserPasswordApi(id: number, payload: SetUserPasswordPayload): Promise<{ detail: string }> {
  const { data } = await axiosInstance.post<{ detail: string }>(`/auth/users/${id}/set-password/`, payload);
  return data;
}

export async function activateUserApi(id: number): Promise<{ detail: string }> {
  const { data } = await axiosInstance.post<{ detail: string }>(`/auth/users/${id}/activate/`);
  return data;
}

export async function deactivateUserApi(id: number): Promise<{ detail: string }> {
  const { data } = await axiosInstance.post<{ detail: string }>(`/auth/users/${id}/deactivate/`);
  return data;
}