"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mutasiStokKeys } from "@/hooks/useMutasiStoks";
import {
  penjemuranService,
  type CreatePenjemuranDto,
  type Penjemuran,
  type UpdatePenjemuranDto,
  type ConfirmPenjemuranDto,
} from "@/services/penjemuranService";

/**
 * Query keys untuk penjemuran
 */
export const penjemuranKeys = {
  all: ["penjemuran"] as const,
  lists: () => [...penjemuranKeys.all, "list"] as const,
  list: (params?: any) => [...penjemuranKeys.lists(), params] as const,
  details: () => [...penjemuranKeys.all, "detail"] as const,
  detail: (id: string) => [...penjemuranKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list penjemuran dengan pagination
 */
export function usePenjemurans(params?: any) {
  return useQuery({
    queryKey: penjemuranKeys.list(params),
    queryFn: () => penjemuranService.getPenjemurans(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail penjemuran berdasarkan ID
 */
export function usePenjemuran(id: string | null) {
  return useQuery({
    queryKey: penjemuranKeys.detail(id!),
    queryFn: () => penjemuranService.getPenjemuranById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat penjemuran baru
 */
export function useCreatePenjemuran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePenjemuranDto) =>
      penjemuranService.createPenjemuran(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: penjemuranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: penjemuranKeys.all });
      toast.success(response.message || "Penjemuran berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Gagal menambahkan penjemuran");
    },
  });
}

/**
 * Hook untuk mengupdate penjemuran
 */
export function useUpdatePenjemuran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePenjemuranDto) =>
      penjemuranService.updatePenjemuran(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: penjemuranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: penjemuranKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: penjemuranKeys.all });
      toast.success(response.message || "Penjemuran berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Gagal mengupdate penjemuran");
    },
  });
}

/**
 * Hook untuk menghapus penjemuran
 */
export function useDeletePenjemuran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => penjemuranService.deletePenjemuran(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: penjemuranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: penjemuranKeys.all });
      toast.success(response.message || "Penjemuran berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Gagal menghapus penjemuran");
    },
  });
}

/**
 * Hook untuk konfirmasi penjemuran
 */
export function useConfirmPenjemuran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConfirmPenjemuranDto }) =>
      penjemuranService.confirmPenjemuran(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: penjemuranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: penjemuranKeys.all });
      queryClient.invalidateQueries({ queryKey: mutasiStokKeys.all });
      toast.success(response.message || "Penjemuran berhasil dikonfirmasi");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Gagal mengonfirmasi penjemuran");
    },
  });
}

