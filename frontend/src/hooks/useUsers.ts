// src/hooks/useUsers.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateUserApi,
  createUserApi,
  deactivateUserApi,
  getUserByIdApi,
  getUsersApi,
  setUserPasswordApi,
  updateUserApi,
} from "@/api/users.api";
import { queryKeys } from "@/hooks/queryKeys";
import type { CreateUserPayload, SetUserPasswordPayload, UpdateUserPayload } from "@/types";

export function useUsers(role?: string) {
  return useQuery({
    queryKey: queryKeys.users(role),
    queryFn: () => getUsersApi(role),
  });
}

export function useUser(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.userDetail(id),
    queryFn: () => getUserByIdApi(id),
    enabled,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUserApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUserApi(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.userDetail(id), data);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useSetUserPassword(id: number) {
  return useMutation({
    mutationFn: (payload: SetUserPasswordPayload) => setUserPasswordApi(id, payload),
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => activateUserApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deactivateUserApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}