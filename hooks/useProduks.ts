"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  produkService,
  type CreateProdukDto,
  type GetProduksParams,
  type Produk,
  type UpdateProdukDto,
} from "@/services/produkService";

/**
 * Query keys untuk produk
 */
export const produkKeys = {
  all: ["produk"] as const,
  lists: () => [...produkKeys.all, "list"] as const,
  list: (params?: GetProduksParams) =>
    [...produkKeys.lists(), params] as const,
  details: () => [...produkKeys.all, "detail"] as const,
  detail: (id: string) => [...produkKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list produk dengan pagination
 */
export function useProduks(params?: GetProduksParams) {
  return useQuery({
    queryKey: produkKeys.list(params),
    queryFn: () => produkService.getProduks(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail produk berdasarkan ID
 */
export function useProduk(id: string | null) {
  return useQuery({
    queryKey: produkKeys.detail(id!),
    queryFn: () => produkService.getProdukById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat produk baru
 */
export function useCreateProduk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProdukDto) => produkService.createProduk(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: produkKeys.lists() });
      toast.success(response.message || "Produk berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan produk");
    },
  });
}

/**
 * Hook untuk mengupdate produk
 */
export function useUpdateProduk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProdukDto) => produkService.updateProduk(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: produkKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: produkKeys.detail(variables.id),
      });
      toast.success(response.message || "Produk berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate produk");
    },
  });
}

/**
 * Hook untuk menghapus produk
 */
export function useDeleteProduk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => produkService.deleteProduk(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: produkKeys.lists() });
      toast.success(response.message || "Produk berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus produk");
    },
  });
}

/**
 * Hook untuk batch delete produk
 */
export function useBatchDeleteProduks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => produkService.deleteProduks(ids),
    onSuccess: (response, ids) => {
      queryClient.invalidateQueries({ queryKey: produkKeys.lists() });
      toast.success(
        response.message || `${ids.length} produk berhasil dihapus`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus produk");
    },
  });
}



