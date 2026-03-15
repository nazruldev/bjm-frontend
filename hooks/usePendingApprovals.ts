"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pendingApprovalService, type GetPendingApprovalsParams } from "@/services/pendingApprovalService";

export const pendingApprovalKeys = {
  all: ["pending-approval"] as const,
  list: (params?: GetPendingApprovalsParams) =>
    [...pendingApprovalKeys.all, "list", params ?? {}] as const,
};

export function usePendingApprovals(
  params?: GetPendingApprovalsParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: pendingApprovalKeys.list(params),
    queryFn: () => pendingApprovalService.getList(params),
    staleTime: 30 * 1000,
    enabled: options?.enabled !== false,
  });
}

export function useResendPendingApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pendingApprovalService.resend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingApprovalKeys.all });
      toast.success("Notifikasi WA telah dikirim ulang ke owner.");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Gagal mengirim ulang notifikasi.");
    },
  });
}
