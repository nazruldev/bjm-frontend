"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  produkProduksiPresetService,
  type CreateProdukProduksiPresetDto,
  type GetProdukProduksiPresetsParams,
  type ProdukProduksiPreset,
  type UpdateProdukProduksiPresetDto,
} from "@/services/produkProduksiPresetService";

/**
 * Query keys untuk ProdukProduksiPreset
 */
export const produkProduksiPresetKeys = {
  all: ["produkProduksiPreset"] as const,
  lists: () => [...produkProduksiPresetKeys.all, "list"] as const,
  list: (params?: GetProdukProduksiPresetsParams) =>
    [...produkProduksiPresetKeys.lists(), params] as const,
  details: () => [...produkProduksiPresetKeys.all, "detail"] as const,
  detail: (id: string) => [...produkProduksiPresetKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list preset dengan pagination
 */
export function useProdukProduksiPresets(params?: GetProdukProduksiPresetsParams) {
  return useQuery({
    queryKey: produkProduksiPresetKeys.list(params),
    queryFn: () => produkProduksiPresetService.getProdukProduksiPresets(params),
  });
}

/**
 * Hook untuk mendapatkan preset berdasarkan ID
 */
export function useProdukProduksiPreset(id: string) {
  return useQuery({
    queryKey: produkProduksiPresetKeys.detail(id),
    queryFn: () => produkProduksiPresetService.getProdukProduksiPresetById(id),
    enabled: !!id,
  });
}

/**
 * Hook untuk membuat preset baru
 */
export function useCreateProdukProduksiPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProdukProduksiPresetDto) =>
      produkProduksiPresetService.createProdukProduksiPreset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: produkProduksiPresetKeys.lists() });
      toast.success("Preset berhasil dibuat");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Gagal membuat preset");
    },
  });
}

/**
 * Hook untuk mengupdate preset
 */
export function useUpdateProdukProduksiPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProdukProduksiPresetDto) =>
      produkProduksiPresetService.updateProdukProduksiPreset(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: produkProduksiPresetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: produkProduksiPresetKeys.detail(variables.id) });
      toast.success("Preset berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Gagal mengupdate preset");
    },
  });
}

/**
 * Hook untuk menghapus preset
 */
export function useDeleteProdukProduksiPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => produkProduksiPresetService.deleteProdukProduksiPreset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: produkProduksiPresetKeys.lists() });
      toast.success("Preset berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Gagal menghapus preset");
    },
  });
}

