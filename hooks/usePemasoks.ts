"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  pemasokService,
  type CreatePemasokDto,
  type GetPemasoksParams,
  type Pemasok,
  type UpdatePemasokDto,
} from "@/services/pemasokService";

/**
 * Query keys untuk pemasok
 */
export const pemasokKeys = {
  all: ["pemasok"] as const,
  lists: () => [...pemasokKeys.all, "list"] as const,
  list: (params?: GetPemasoksParams) =>
    [...pemasokKeys.lists(), params] as const,
  details: () => [...pemasokKeys.all, "detail"] as const,
  detail: (id: string) => [...pemasokKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list pemasok dengan pagination
 */
export function usePemasoks(params?: GetPemasoksParams) {
  return useQuery({
    queryKey: pemasokKeys.list(params),
    queryFn: () => pemasokService.getPemasoks(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail pemasok berdasarkan ID
 */
export function usePemasok(id: string | null) {
  return useQuery({
    queryKey: pemasokKeys.detail(id!),
    queryFn: () => pemasokService.getPemasokById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat pemasok baru
 */
export function useCreatePemasok() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePemasokDto) => pemasokService.createPemasok(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pemasokKeys.lists() });
      toast.success(response.message || "Pemasok berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan pemasok");
    },
  });
}

/**
 * Hook untuk mengupdate pemasok
 */
export function useUpdatePemasok() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePemasokDto) => pemasokService.updatePemasok(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: pemasokKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: pemasokKeys.detail(variables.id),
      });
      toast.success(response.message || "Pemasok berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate pemasok");
    },
  });
}

/**
 * Hook untuk menghapus pemasok
 */
export function useDeletePemasok() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pemasokService.deletePemasok(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pemasokKeys.lists() });
      toast.success(response.message || "Pemasok berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus pemasok");
    },
  });
}

/**
 * Hook untuk batch delete pemasok
 */
export function useBatchDeletePemasoks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => pemasokService.deletePemasoks(ids),
    onSuccess: (response, ids) => {
      queryClient.invalidateQueries({ queryKey: pemasokKeys.lists() });
      toast.success(
        response.message || `${ids.length} pemasok berhasil dihapus`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus pemasok");
    },
  });
}
