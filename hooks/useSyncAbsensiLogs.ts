import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  syncAbsensiLogService,
  type GetSyncAbsensiLogsParams,
} from "@/services/syncAbsensiLogService";

export function useSyncAbsensiLogs(params?: GetSyncAbsensiLogsParams) {
  return useQuery({
    queryKey: ["sync-absensi-logs", params],
    queryFn: async () => {
      const res = await syncAbsensiLogService.getLogs(params);
      return res;
    },
  });
}

export function useSyncAbsensiManual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => syncAbsensiLogService.syncNow(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
      queryClient.invalidateQueries({ queryKey: ["sync-absensi-logs"] });
      if (res.success) {
        const d = res.data;
        const detail = d ? `Event: ${d.eventsCount ?? 0}, buat: ${d.created ?? 0}, update: ${d.updated ?? 0}` : "";
        toast.success(`Sync absensi berhasil. ${detail}`.trim());
      } else {
        toast.success("Sync selesai.");
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Gagal sync absensi";
      toast.error(msg);
    },
  });
}
