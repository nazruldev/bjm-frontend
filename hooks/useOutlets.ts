"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  outletService,
  type CreateOutletDto,
  type GetOutletsParams,
  type Outlet,
  type UpdateOutletDto,
} from "@/services/outletService";
import { karyawanKeys } from "@/hooks/useKaryawans";

/**
 * Query keys untuk outlet
 */
export const outletKeys = {
  all: ["outlets"] as const,
  lists: () => [...outletKeys.all, "list"] as const,
  list: (params?: GetOutletsParams) =>
    [...outletKeys.lists(), params] as const,
  details: () => [...outletKeys.all, "detail"] as const,
  detail: (id: string) => [...outletKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list outlet dengan pagination
 */
export function useOutlets(params?: GetOutletsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: outletKeys.list(params),
    queryFn: () => outletService.getOutlets(params),
    enabled: options?.enabled !== false, // Default enabled, bisa di-disable
    staleTime: 5 * 60 * 1000, // 5 menit
    gcTime: 10 * 60 * 1000, // 10 menit (sebelumnya cacheTime)
  });
}

/**
 * Hook untuk mendapatkan detail outlet berdasarkan ID
 */
export function useOutlet(id: string | null) {
  return useQuery({
    queryKey: outletKeys.detail(id!),
    queryFn: () => outletService.getOutletById(id!),
    enabled: !!id, // Hanya fetch jika id ada
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk outlet aktif (untuk OWNER mengikuti selected outlet via header X-Outlet-Id)
 */
export function useCurrentOutlet(
  outletId?: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...outletKeys.all, "current", outletId ?? null],
    queryFn: () => outletService.getCurrentOutlet(outletId),
    enabled: options?.enabled !== false,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat outlet baru
 */
export function useCreateOutlet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOutletDto) => outletService.createOutlet(data),
    onSuccess: (response) => {
      // Invalidate dan refetch list outlet
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() });
      toast.success(response.message || "Outlet berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan outlet");
    },
  });
}

/**
 * Hook untuk mengupdate outlet
 */
export function useUpdateOutlet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOutletDto) => outletService.updateOutlet(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: outletKeys.detail(variables.id),
      });
      // Karyawan ikut ACS outlet; invalidate agar list karyawan refetch (status biometric dll)
      queryClient.invalidateQueries({ queryKey: karyawanKeys.lists() });
      toast.success(response.message || "Outlet berhasil diupdate");
      // Refresh halaman agar data (termasuk ACS default outlet) ter-update penuh
      if (typeof window !== "undefined") window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate outlet");
    },
  });
}

/**
 * Hook untuk menghapus outlet
 */
export function useDeleteOutlet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => outletService.deleteOutlet(id),
    onSuccess: (response) => {
      // Invalidate dan refetch list outlet
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() });
      toast.success(response.message || "Outlet berhasil dihapus");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? error?.message ?? "Gagal menghapus outlet";
      toast.error(msg);
    },
  });
}

/**
 * Hook untuk batch delete outlet
 */
export function useBatchDeleteOutlets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => outletService.deleteOutlets(ids),
    onSuccess: (response, ids) => {
      // Invalidate dan refetch list outlet
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() });
      toast.success(
        response.message || `${ids.length} outlet berhasil dihapus`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus outlet");
    },
  });
}

/**
 * Hook untuk kirim ringkasan hari ini ke WA via gateway Kirimi (tombol Tutup Toko).
 * Param: { outletId, password, uangDiambil? }
 */
export function useRingkasanHariIni() {
  return useMutation({
    mutationFn: (params: {
      outletId?: string | null;
      password: string;
      uangDiambil?: number;
    }) =>
      outletService.kirimRingkasanWa(params.outletId, {
        password: params.password,
        uangDiambil: params.uangDiambil,
      }),
    onSuccess: (data) => {
      toast.success(data?.message || "Ringkasan hari ini berhasil dikirim ke WhatsApp");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || "Gagal mengirim ringkasan ke WhatsApp";
      toast.error(message);
    },
  });
}


