"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  penggunaService,
  type CreatePenggunaDto,
  type GetPenggunasParams,
  type Pengguna,
  type UpdatePenggunaDto,
} from "@/services/penggunaService";

/**
 * Query keys untuk pengguna
 */
export const penggunaKeys = {
  all: ["pengguna"] as const,
  lists: () => [...penggunaKeys.all, "list"] as const,
  list: (params?: GetPenggunasParams) =>
    [...penggunaKeys.lists(), params] as const,
  details: () => [...penggunaKeys.all, "detail"] as const,
  detail: (id: string) => [...penggunaKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list pengguna dengan pagination
 */
export function usePenggunas(params?: GetPenggunasParams) {
  return useQuery({
    queryKey: penggunaKeys.list(params),
    queryFn: () => penggunaService.getPenggunas(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail pengguna berdasarkan ID
 */
export function usePengguna(id: string | null) {
  return useQuery({
    queryKey: penggunaKeys.detail(id!),
    queryFn: () => penggunaService.getPenggunaById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat pengguna baru
 */
export function useCreatePengguna() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePenggunaDto) => penggunaService.createPengguna(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: penggunaKeys.lists() });
      toast.success(response.message || "Pengguna berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan pengguna");
    },
  });
}

/**
 * Hook untuk mengupdate pengguna
 */
export function useUpdatePengguna() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePenggunaDto) => penggunaService.updatePengguna(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: penggunaKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: penggunaKeys.detail(variables.id),
      });
      toast.success(response.message || "Pengguna berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate pengguna");
    },
  });
}

/**
 * Hook untuk menghapus pengguna
 */
export function useDeletePengguna() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => penggunaService.deletePengguna(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: penggunaKeys.lists() });
      toast.success(response.message || "Pengguna berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus pengguna");
    },
  });
}

/**
 * Hook untuk batch delete pengguna
 */
export function useBatchDeletePenggunas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => penggunaService.deletePenggunas(ids),
    onSuccess: (response, ids) => {
      queryClient.invalidateQueries({ queryKey: penggunaKeys.lists() });
      toast.success(
        response.message || `${ids.length} pengguna berhasil dihapus`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus pengguna");
    },
  });
}