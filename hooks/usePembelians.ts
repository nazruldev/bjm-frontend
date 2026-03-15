import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  pembelianService,
  type Pembelian,
  type CreatePembelianDto,
  type GetPembeliansParams,
} from "@/services/pembelianService";
import { mutasiStokKeys } from "@/hooks/useMutasiStoks";
import { hutangKeys } from "@/hooks/useHutangs";
import { pendingApprovalKeys } from "@/hooks/usePendingApprovals";
import { toast } from "sonner";

/**
 * Hook untuk mendapatkan semua pembelian
 */
export function usePembelians(params?: GetPembeliansParams) {
  return useQuery({
    queryKey: ["pembelians", params],
    queryFn: async () => {
      const response = await pembelianService.getPembelians(params);
      return response;
    },
  });
}

/**
 * Hook untuk mendapatkan pembelian by ID
 */
export function usePembelian(id: string | null) {
  return useQuery({
    queryKey: ["pembelian", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await pembelianService.getPembelianById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook untuk create pembelian
 */
export function useCreatePembelian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePembelianDto) => {
      const response = await pembelianService.createPembelian(data);
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["pembelians"] });
      queryClient.invalidateQueries({ queryKey: mutasiStokKeys.all });
      queryClient.invalidateQueries({ queryKey: hutangKeys.all });
      if (data?.data?.pendingApprovalId) {
        queryClient.invalidateQueries({ queryKey: pendingApprovalKeys.all });
        toast.success("Pembelian berhasil. Pembayaran cashless menunggu approval owner.");
      } else {
        toast.success("Pembelian berhasil dibuat");
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Gagal membuat pembelian";
      toast.error(message);
    },
  });
}

/**
 * Hook untuk delete pembelian
 */
export function useDeletePembelian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await pembelianService.deletePembelian(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pembelians"] });
      toast.success("Pembelian berhasil dihapus");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Gagal menghapus pembelian";
      toast.error(message);
    },
  });
}

/**
 * Hook untuk get summary pembelian
 */
export function usePembelianSummary(
  params?: { dateFrom?: string; dateTo?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["pembelian-summary", params],
    queryFn: async () => {
      const response = await pembelianService.getSummary(params);
      return response.data;
    },
    enabled: options?.enabled !== false,
  });
}



