"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  pekerjaService,
  type CreatePekerjaDto,
  type GetPekerjasParams,
  type Pekerja,
  type UpdatePekerjaDto,
} from "@/services/pekerjaService";

/**
 * Query keys untuk pekerja
 */
export const pekerjaKeys = {
  all: ["pekerja"] as const,
  lists: () => [...pekerjaKeys.all, "list"] as const,
  list: (params?: GetPekerjasParams) =>
    [...pekerjaKeys.lists(), params] as const,
  details: () => [...pekerjaKeys.all, "detail"] as const,
  detail: (id: string) => [...pekerjaKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list pekerja dengan pagination
 */
export function usePekerjas(params?: GetPekerjasParams) {
  return useQuery({
    queryKey: pekerjaKeys.list(params),
    queryFn: () => pekerjaService.getPekerjas(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail pekerja berdasarkan ID
 */
export function usePekerja(id: string | null) {
  return useQuery({
    queryKey: pekerjaKeys.detail(id!),
    queryFn: () => pekerjaService.getPekerjaById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat pekerja baru
 */
export function useCreatePekerja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePekerjaDto) => pekerjaService.createPekerja(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pekerjaKeys.lists() });
      toast.success(response.message || "Pekerja berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan pekerja");
    },
  });
}

/**
 * Hook untuk mengupdate pekerja
 */
export function useUpdatePekerja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePekerjaDto) => pekerjaService.updatePekerja(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: pekerjaKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: pekerjaKeys.detail(variables.id),
      });
      toast.success(response.message || "Pekerja berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate pekerja");
    },
  });
}

/**
 * Hook untuk menghapus pekerja
 */
export function useDeletePekerja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pekerjaService.deletePekerja(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pekerjaKeys.lists() });
      toast.success(response.message || "Pekerja berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus pekerja");
    },
  });
}

/**
 * Hook untuk batch delete pekerja
 */
export function useBatchDeletePekerjas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => pekerjaService.deletePekerjas(ids),
    onSuccess: (response, ids) => {
      queryClient.invalidateQueries({ queryKey: pekerjaKeys.lists() });
      toast.success(
        response.message || `${ids.length} pekerja berhasil dihapus`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus pekerja");
    },
  });
}
