"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  gajiService,
  type CreateGajiDto,
  type GetGajisParams,
  type Gaji,
  type UpdateGajiDto,
} from "@/services/gajiService";

/**
 * Query keys untuk gaji
 */
export const gajiKeys = {
  all: ["gaji"] as const,
  lists: () => [...gajiKeys.all, "list"] as const,
  list: (params?: GetGajisParams) =>
    [...gajiKeys.lists(), params] as const,
  details: () => [...gajiKeys.all, "detail"] as const,
  detail: (id: number) => [...gajiKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list gaji dengan pagination
 */
export function useGajis(params?: GetGajisParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: gajiKeys.list(params),
    queryFn: () => gajiService.getGajis(params),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail gaji berdasarkan ID
 */
export function useGaji(id: number | null) {
  return useQuery({
    queryKey: gajiKeys.detail(id!),
    queryFn: () => gajiService.getGajiById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat gaji baru
 */
export function useCreateGaji() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGajiDto) => gajiService.createGaji(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: gajiKeys.lists() });
      toast.success(response.message || "Gaji berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan gaji");
    },
  });
}

/**
 * Hook untuk mengupdate gaji
 */
export function useUpdateGaji() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateGajiDto) => gajiService.updateGaji(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: gajiKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: gajiKeys.detail(variables.id),
      });
      toast.success(response.message || "Gaji berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate gaji");
    },
  });
}

/**
 * Hook untuk menghapus gaji
 */
export function useDeleteGaji() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => gajiService.deleteGaji(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: gajiKeys.lists() });
      toast.success(response.message || "Gaji berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus gaji");
    },
  });
}

/**
 * Hook untuk batch delete gaji
 */
export function useBatchDeleteGajis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: (number | string)[]) => gajiService.deleteGajis(ids),
    onSuccess: (response, ids) => {
      queryClient.invalidateQueries({ queryKey: gajiKeys.lists() });
      toast.success(
        response.message || `${ids.length} gaji berhasil dihapus`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus gaji");
    },
  });
}

