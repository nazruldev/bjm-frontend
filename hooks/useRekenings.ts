"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  rekeningService,
  type CreateRekeningDto,
  type GetRekeningsParams,
  type Rekening,
  type UpdateRekeningDto,
} from "@/services/rekeningService";

/**
 * Query keys untuk rekening
 */
export const rekeningKeys = {
  all: ["rekening"] as const,
  lists: () => [...rekeningKeys.all, "list"] as const,
  list: (params?: GetRekeningsParams) =>
    [...rekeningKeys.lists(), params] as const,
  details: () => [...rekeningKeys.all, "detail"] as const,
  detail: (id: string) => [...rekeningKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list rekening dengan pagination
 */
export function useRekenings(params?: GetRekeningsParams) {
  return useQuery({
    queryKey: rekeningKeys.list(params),
    queryFn: () => rekeningService.getRekenings(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail rekening berdasarkan ID
 */
export function useRekening(id: string | null) {
  return useQuery({
    queryKey: rekeningKeys.detail(id!),
    queryFn: () => rekeningService.getRekeningById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat rekening baru
 */
export function useCreateRekening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRekeningDto) => rekeningService.createRekening(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: rekeningKeys.lists() });
      toast.success(response.message || "Rekening berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan rekening");
    },
  });
}

/**
 * Hook untuk mengupdate rekening
 */
export function useUpdateRekening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRekeningDto) => rekeningService.updateRekening(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: rekeningKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: rekeningKeys.detail(variables.id),
      });
      toast.success(response.message || "Rekening berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate rekening");
    },
  });
}

/**
 * Hook untuk menghapus rekening
 */
export function useDeleteRekening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rekeningService.deleteRekening(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: rekeningKeys.lists() });
      toast.success(response.message || "Rekening berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus rekening");
    },
  });
}

/**
 * Hook untuk batch delete rekening
 */
export function useBatchDeleteRekenings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => rekeningService.deleteRekenings(ids),
    onSuccess: (response, ids) => {
      queryClient.invalidateQueries({ queryKey: rekeningKeys.lists() });
      toast.success(
        response.message || `${ids.length} rekening berhasil dihapus`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus rekening");
    },
  });
}