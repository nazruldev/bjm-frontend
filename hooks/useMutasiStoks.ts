"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  mutasiStokService,
  type CreateMutasiStokDto,
  type GetMutasiStoksParams,
  type MutasiStok,
  type UpdateMutasiStokDto,
  type ProdukWithStok,
} from "@/services/mutasiStokService";

/**
 * Query keys untuk mutasi stok
 */
export const mutasiStokKeys = {
  all: ["mutasiStok"] as const,
  lists: () => [...mutasiStokKeys.all, "list"] as const,
  list: (params?: GetMutasiStoksParams) =>
    [...mutasiStokKeys.lists(), params] as const,
  details: () => [...mutasiStokKeys.all, "detail"] as const,
  detail: (id: string) => [...mutasiStokKeys.details(), id] as const,
  byProduk: (produkId: string, params?: any) =>
    [...mutasiStokKeys.all, "byProduk", produkId, params] as const,
  summary: (params?: any) => [...mutasiStokKeys.all, "summary", params] as const,
  produkGrouped: (params?: any) =>
    [...mutasiStokKeys.all, "produkGrouped", params] as const,
};

/**
 * Hook untuk mendapatkan list mutasi stok dengan pagination
 */
export function useMutasiStoks(params?: GetMutasiStoksParams) {
  return useQuery({
    queryKey: mutasiStokKeys.list(params),
    queryFn: () => mutasiStokService.getMutasiStoks(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail mutasi stok berdasarkan ID
 */
export function useMutasiStok(id: string | null) {
  return useQuery({
    queryKey: mutasiStokKeys.detail(id!),
    queryFn: () => mutasiStokService.getMutasiStokById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan mutasi stok berdasarkan produk ID
 */
export function useMutasiStokByProduk(
  produkId: string | null,
  params?: Omit<GetMutasiStoksParams, "produkId">
) {
  return useQuery({
    queryKey: mutasiStokKeys.byProduk(produkId!, params),
    queryFn: () => mutasiStokService.getMutasiStokByProduk(produkId!, params),
    enabled: !!produkId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat mutasi stok baru
 */
export function useCreateMutasiStok() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMutasiStokDto) =>
      mutasiStokService.createMutasiStok(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: mutasiStokKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mutasiStokKeys.all });
      toast.success(response.message || "Mutasi stok berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan mutasi stok");
    },
  });
}

/**
 * Hook untuk mengupdate mutasi stok
 */
export function useUpdateMutasiStok() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMutasiStokDto) =>
      mutasiStokService.updateMutasiStok(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: mutasiStokKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: mutasiStokKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: mutasiStokKeys.all });
      toast.success(response.message || "Mutasi stok berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate mutasi stok");
    },
  });
}

/**
 * Hook untuk menghapus mutasi stok
 */
export function useDeleteMutasiStok() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mutasiStokService.deleteMutasiStok(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: mutasiStokKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mutasiStokKeys.all });
      toast.success(response.message || "Mutasi stok berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus mutasi stok");
    },
  });
}

/**
 * Hook untuk mendapatkan summary mutasi stok
 */
export function useMutasiStokSummary(
  params?: Omit<GetMutasiStoksParams, "page" | "limit">
) {
  return useQuery({
    queryKey: mutasiStokKeys.summary(params),
    queryFn: () => mutasiStokService.getSummary(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan produk dengan total stok (grouped by produk)
 */
export function useProdukWithStok(
  params?: Omit<GetMutasiStoksParams, "page" | "limit">
) {
  return useQuery({
    queryKey: mutasiStokKeys.produkGrouped(params),
    queryFn: () => mutasiStokService.getProdukWithStok(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

