 "use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mutasiStokKeys } from "@/hooks/useMutasiStoks";
import {
  pengupasanService,
  type CreatePengupasanDto,
  type Pengupasan,
  type UpdatePengupasanDto,
  type ConfirmPengupasanDto,
} from "@/services/pengupasanService";

/**
 * Query keys untuk pengupasan
 */
export const pengupasanKeys = {
  all: ["pengupasan"] as const,
  lists: () => [...pengupasanKeys.all, "list"] as const,
  list: (params?: any) => [...pengupasanKeys.lists(), params] as const,
  details: () => [...pengupasanKeys.all, "detail"] as const,
  detail: (id: string) => [...pengupasanKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list pengupasan dengan pagination
 */
export function usePengupasans(params?: any) {
  return useQuery({
    queryKey: pengupasanKeys.list(params),
    queryFn: () => pengupasanService.getPengupasans(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail pengupasan berdasarkan ID
 */
export function usePengupasan(id: string | null) {
  return useQuery({
    queryKey: pengupasanKeys.detail(id!),
    queryFn: () => pengupasanService.getPengupasanById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat pengupasan baru
 */
export function useCreatePengupasan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePengupasanDto) =>
      pengupasanService.createPengupasan(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pengupasanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pengupasanKeys.all });
      toast.success(response.message || "Pengupasan berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Gagal menambahkan pengupasan");
    },
  });
}

/**
 * Hook untuk mengupdate pengupasan
 */
export function useUpdatePengupasan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePengupasanDto) =>
      pengupasanService.updatePengupasan(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: pengupasanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pengupasanKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: pengupasanKeys.all });
      toast.success(response.message || "Pengupasan berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Gagal mengupdate pengupasan");
    },
  });
}

/**
 * Hook untuk menghapus pengupasan
 */
export function useDeletePengupasan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pengupasanService.deletePengupasan(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pengupasanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pengupasanKeys.all });
      toast.success(response.message || "Pengupasan berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Gagal menghapus pengupasan");
    },
  });
}

/**
 * Hook untuk konfirmasi pengupasan
 */
export function useConfirmPengupasan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConfirmPengupasanDto }) =>
      pengupasanService.confirmPengupasan(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pengupasanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pengupasanKeys.all });
      queryClient.invalidateQueries({ queryKey: mutasiStokKeys.all });
      toast.success(response.message || "Pengupasan berhasil dikonfirmasi");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Gagal mengonfirmasi pengupasan");
    },
  });
}
