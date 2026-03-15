"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mutasiStokKeys } from "@/hooks/useMutasiStoks";
import {
  pensortiranService,
  type CreatePensortiranDto,
  type Pensortiran,
  type UpdatePensortiranDto,
  type ConfirmPensortiranDto,
  type GetPensortiransParams,
} from "@/services/pensortiranService";

/**
 * Query keys untuk pensortiran
 */
export const pensortiranKeys = {
  all: ["pensortiran"] as const,
  lists: () => [...pensortiranKeys.all, "list"] as const,
  list: (params?: GetPensortiransParams) => [...pensortiranKeys.lists(), params] as const,
  details: () => [...pensortiranKeys.all, "detail"] as const,
  detail: (id: string) => [...pensortiranKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list pensortiran dengan pagination
 */
export function usePensortirans(params?: GetPensortiransParams) {
  return useQuery({
    queryKey: pensortiranKeys.list(params),
    queryFn: () => pensortiranService.getPensortirans(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail pensortiran berdasarkan ID
 */
export function usePensortiran(id: string | null) {
  return useQuery({
    queryKey: pensortiranKeys.detail(id!),
    queryFn: () => pensortiranService.getPensortiranById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat pensortiran baru
 */
export function useCreatePensortiran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePensortiranDto) =>
      pensortiranService.createPensortiran(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pensortiranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pensortiranKeys.all });
      toast.success(response.message || "Pensortiran berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Gagal menambahkan pensortiran");
    },
  });
}

/**
 * Hook untuk menghapus pensortiran
 */
export function useDeletePensortiran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pensortiranService.deletePensortiran(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pensortiranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pensortiranKeys.all });
      toast.success(response.message || "Pensortiran berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Gagal menghapus pensortiran");
    },
  });
}

/**
 * Hook untuk konfirmasi pensortiran
 */
export function useConfirmPensortiran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConfirmPensortiranDto }) =>
      pensortiranService.confirmPensortiran(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pensortiranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pensortiranKeys.all });
      queryClient.invalidateQueries({ queryKey: mutasiStokKeys.all });
      toast.success(response.message || "Pensortiran berhasil dikonfirmasi");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Gagal mengonfirmasi pensortiran");
    },
  });
}
