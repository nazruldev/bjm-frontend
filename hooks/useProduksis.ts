"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  produksiService,
  type CreateProduksiDto,
  type GetProduksisParams,
  type Produksi,
  type UpdateProduksiDto,
} from "@/services/produksiService";

/**
 * Query keys untuk produksi
 */
export const produksiKeys = {
  all: ["produksi"] as const,
  lists: () => [...produksiKeys.all, "list"] as const,
  list: (params?: GetProduksisParams) =>
    [...produksiKeys.lists(), params] as const,
  details: () => [...produksiKeys.all, "detail"] as const,
  detail: (id: string) => [...produksiKeys.details(), id] as const,
  summary: (params?: any) => [...produksiKeys.all, "summary", params] as const,
};

/**
 * Hook untuk mendapatkan list produksi dengan pagination
 */
export function useProduksis(params?: GetProduksisParams) {
  return useQuery({
    queryKey: produksiKeys.list(params),
    queryFn: () => produksiService.getProduksis(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail produksi berdasarkan ID
 */
export function useProduksi(id: string | null) {
  return useQuery({
    queryKey: produksiKeys.detail(id!),
    queryFn: () => produksiService.getProduksiById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat produksi baru
 */
export function useCreateProduksi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProduksiDto) =>
      produksiService.createProduksi(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: produksiKeys.lists() });
      queryClient.invalidateQueries({ queryKey: produksiKeys.all });
      toast.success(response.message || "Produksi berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan produksi");
    },
  });
}

/**
 * Hook untuk mengupdate produksi
 */
export function useUpdateProduksi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProduksiDto) =>
      produksiService.updateProduksi(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: produksiKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: produksiKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: produksiKeys.all });
      toast.success(response.message || "Produksi berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate produksi");
    },
  });
}

/**
 * Hook untuk menghapus produksi
 */
export function useDeleteProduksi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => produksiService.deleteProduksi(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: produksiKeys.lists() });
      queryClient.invalidateQueries({ queryKey: produksiKeys.all });
      toast.success(response.message || "Produksi berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus produksi");
    },
  });
}

/**
 * Hook untuk mendapatkan summary produksi
 */
export function useProduksiSummary(
  params?: Omit<GetProduksisParams, "page" | "limit">
) {
  return useQuery({
    queryKey: produksiKeys.summary(params),
    queryFn: () => produksiService.getSummary(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

