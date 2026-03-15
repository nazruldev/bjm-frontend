import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  penjualanService,
  type Penjualan,
  type CreatePenjualanDto,
  type GetPenjualansParams,
} from "@/services/penjualanService";
import { piutangKeys } from "@/hooks/usePiutangs";
import { toast } from "sonner";

export function usePenjualans(params?: GetPenjualansParams) {
  return useQuery({
    queryKey: ["penjualans", params],
    queryFn: async () => penjualanService.getPenjualans(params),
  });
}

export function usePenjualan(id: string | null) {
  return useQuery({
    queryKey: ["penjualan", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await penjualanService.getPenjualanById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreatePenjualan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePenjualanDto) => {
      const res = await penjualanService.createPenjualan(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penjualans"] });
      queryClient.invalidateQueries({ queryKey: piutangKeys.all });
      toast.success("Penjualan berhasil dibuat");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || "Gagal membuat penjualan";
      toast.error(msg);
    },
  });
}

export function useDeletePenjualan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await penjualanService.deletePenjualan(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penjualans"] });
      toast.success("Penjualan berhasil dihapus");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || "Gagal menghapus penjualan";
      toast.error(msg);
    },
  });
}

export function usePenjualanSummary(
  params?: { dateFrom?: string; dateTo?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["penjualan-summary", params],
    queryFn: async () => {
      const res = await penjualanService.getSummary(params);
      return res.data;
    },
    enabled: options?.enabled !== false,
  });
}
