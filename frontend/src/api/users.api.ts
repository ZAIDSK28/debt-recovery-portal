import { axiosInstance } from "@/api/axiosInstance";
import type { PaginatedResponse, User } from "@/types";

export async function getUsersApi(role?: string): Promise<User[]> {
  const { data } = await axiosInstance.get<User[] | PaginatedResponse<User>>("/auth/users/", {
    params: role ? { role } : undefined,
  });
  return Array.isArray(data) ? data : data.results;
}