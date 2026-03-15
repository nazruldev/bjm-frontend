"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  karyawanService,
  type CreateKaryawanDto,
  type GetKaryawansParams,
  type Karyawan,
  type UpdateKaryawanDto,
} from "@/services/karyawanService";

/**
 * Query keys untuk karyawan
 */
export const karyawanKeys = {
  all: ["karyawan"] as const,
  lists: () => [...karyawanKeys.all, "list"] as const,
  list: (params?: GetKaryawansParams) =>
    [...karyawanKeys.lists(), params] as const,
  details: () => [...karyawanKeys.all, "detail"] as const,
  detail: (id: string) => [...karyawanKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list karyawan dengan pagination
 */
export function useKaryawans(params?: GetKaryawansParams) {
  return useQuery({
    queryKey: karyawanKeys.list(params),
    queryFn: () => karyawanService.getKaryawans(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook untuk mendapatkan detail karyawan berdasarkan ID
 */
export function useKaryawan(id: string | null) {
  return useQuery({
    queryKey: karyawanKeys.detail(id!),
    queryFn: () => karyawanService.getKaryawanById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat karyawan baru
 */
export function useCreateKaryawan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateKaryawanDto) => karyawanService.createKaryawan(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: karyawanKeys.lists() });
      toast.success(response.message || "Karyawan berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan karyawan");
    },
  });
}

/**
 * Hook untuk mengupdate karyawan
 */
export function useUpdateKaryawan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateKaryawanDto) => karyawanService.updateKaryawan(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: karyawanKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: karyawanKeys.detail(variables.id),
      });
      toast.success(response.message || "Karyawan berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate karyawan");
    },
  });
}

/**
 * Hook untuk menghapus karyawan
 */
export function useDeleteKaryawan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => karyawanService.deleteKaryawan(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: karyawanKeys.lists() });
      toast.success(response.message || "Karyawan berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus karyawan");
    },
  });
}

/**
 * Hook untuk batch delete karyawan
 */
export function useBatchDeleteKaryawans() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => karyawanService.deleteKaryawans(ids),
    onSuccess: (response, ids) => {
      queryClient.invalidateQueries({ queryKey: karyawanKeys.lists() });
      toast.success(
        response.message || `${ids.length} karyawan berhasil dihapus`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus karyawan");
    },
  });
}

/**
 * Hook untuk pindah outlet karyawan (hanya OWNER)
 */
export function usePindahOutlet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, outletId }: { id: string; outletId: string }) =>
      karyawanService.pindahOutlet(id, outletId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: karyawanKeys.lists() });
      toast.success(response.message || "Karyawan berhasil dipindah outlet");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          error?.message ??
          "Gagal memindah outlet karyawan"
      );
    },
  });
}

/**
 * Hook untuk aktifkan biometric (daftar karyawan ke device Hik)
 */
export function useAktifkanBiometric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (karyawanId: string) =>
      karyawanService.aktifkanBiometric(karyawanId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: karyawanKeys.lists() });
      toast.success(response.message || "Biometric berhasil diaktifkan");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          error?.message ??
          "Gagal mengaktifkan biometric"
      );
    },
  });
}

/**
 * Hook untuk generate link form mandiri (self-service) karyawan
 */
export function useGenerateSelfServiceLink() {
  return useMutation({
    mutationFn: (karyawanId: string) =>
      karyawanService.generateSelfServiceLink(karyawanId),
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? error?.message ?? "Gagal membuat link"
      );
    },
  });
}

/**
 * Hook untuk kirim link form mandiri ke WhatsApp via gateway KiRIMI
 */
export function useSendMandiriLinkWa() {
  return useMutation({
    mutationFn: ({ receiver, url }: { receiver: string; url: string }) =>
      karyawanService.sendMandiriLinkWa(receiver, url),
    onSuccess: (data) => {
      toast.success(data?.message ?? "Link berhasil dikirim ke WhatsApp");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Gagal mengirim ke WhatsApp";
      toast.error(msg);
    },
  });
}

/**
 * Query keys untuk karyawan without gaji
 */
export const karyawanWithoutGajiKeys = {
  all: ["karyawan", "without-gaji"] as const,
  lists: () => [...karyawanWithoutGajiKeys.all, "list"] as const,
  list: (params?: Omit<GetKaryawansParams, "page" | "limit">) =>
    [...karyawanWithoutGajiKeys.lists(), params] as const,
};

/**
 * Hook untuk mendapatkan karyawan yang belum ter-assign ke gaji
 */
export function useKaryawansWithoutGaji(
  params?: Omit<GetKaryawansParams, "page" | "limit">
) {
  return useQuery({
    queryKey: karyawanWithoutGajiKeys.list(params),
    queryFn: () => karyawanService.getKaryawansWithoutGaji(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}