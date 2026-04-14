import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPaymentsApi,
  recordPaymentApi,
  updatePaymentStatusApi,
  type PaymentsQueryParams,
  type RecordPaymentPayload,
} from "@/api/payments.api";
import { queryKeys } from "@/hooks/queryKeys";

export function usePayments(params: PaymentsQueryParams) {
  return useQuery({
    queryKey: queryKeys.payments(params),
    queryFn: () => getPaymentsApi(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ billId, payload }: { billId: number; payload: RecordPaymentPayload }) =>
      recordPaymentApi(billId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["bills"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.todayTotals });
      void queryClient.invalidateQueries({ queryKey: ["daily-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cheque_status }: { id: number; cheque_status: "pending" | "cleared" | "bounced" }) =>
      updatePaymentStatusApi(id, { cheque_status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["bills"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.todayTotals });
      void queryClient.invalidateQueries({ queryKey: ["daily-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
    },
  });
}