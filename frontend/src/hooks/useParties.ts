// src/hooks/useParties.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPartyApi,
  getPartiesApi,
  getPartyByIdApi,
  updatePartyApi,
  type CreatePartyPayload,
  type PartyQueryParams,
  type UpdatePartyPayload,
} from "@/api/parties.api";

const partyKeys = {
  all: ["parties"] as const,
  list: (params?: PartyQueryParams) => ["parties", "list", params] as const,
  detail: (id: number) => ["parties", "detail", id] as const,
};

export function useParties(params?: PartyQueryParams) {
  return useQuery({
    queryKey: partyKeys.list(params),
    queryFn: () => getPartiesApi(params),
  });
}

export function useParty(id: number, enabled = true) {
  return useQuery({
    queryKey: partyKeys.detail(id),
    queryFn: () => getPartyByIdApi(id),
    enabled,
  });
}

export function useCreateParty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePartyPayload) => createPartyApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: partyKeys.all });
    },
  });
}

export function useUpdateParty(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePartyPayload) => updatePartyApi(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(partyKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: partyKeys.all });
    },
  });
}