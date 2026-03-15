"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  gajiKaryawanService,
  type CreateGajiKaryawanDto,
  type GetGajiKaryawansParams,
  type GajiKaryawan,
  type UpdateGajiKaryawanDto,
} from "@/services/gajiKaryawanService";

/**
 * Query keys untuk gaji karyawan
 */
export const gajiKaryawanKeys = {
  all: ["gajiKaryawan"] as const,
  lists: () => [...gajiKaryawanKeys.all, "list"] as const,
  list: (params?: GetGajiKaryawansParams) =>
    [...gajiKaryawanKeys.lists(), params] as const,
  details: () => [...gajiKaryawanKeys.all, "detail"] as const,
  detail: (id: number) => [...gajiKaryawanKeys.details(), id] as const,
};

/**
 * Hook untuk mendapatkan list gaji karyawan dengan pagination
 */
export function useGajiKaryawans(params?: GetGajiKaryawansParams) {
  return useQuery({
    queryKey: gajiKaryawanKeys.list(params),
    queryFn: () => gajiKaryawanService.getGajiKaryawans(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail gaji karyawan berdasarkan ID
 */
export function useGajiKaryawan(id: number | null) {
  return useQuery({
    queryKey: gajiKaryawanKeys.detail(id!),
    queryFn: () => gajiKaryawanService.getGajiKaryawanById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat gaji karyawan baru
 */
export function useCreateGajiKaryawan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGajiKaryawanDto) => gajiKaryawanService.createGajiKaryawan(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: gajiKaryawanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["gaji", "list"] }); // Invalidate gaji list to update count
      queryClient.invalidateQueries({ queryKey: ["karyawan", "without-gaji"] }); // Invalidate karyawan without gaji
      toast.success(response.message || "Gaji karyawan berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan gaji karyawan");
    },
  });
}

/**
 * Hook untuk mengupdate gaji karyawan
 */
export function useUpdateGajiKaryawan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateGajiKaryawanDto) => gajiKaryawanService.updateGajiKaryawan(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: gajiKaryawanKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: gajiKaryawanKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ["gaji", "list"] }); // Invalidate gaji list to update count
      toast.success(response.message || "Gaji karyawan berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate gaji karyawan");
    },
  });
}

/**
 * Hook untuk menghapus gaji karyawan
 */
export function useDeleteGajiKaryawan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => gajiKaryawanService.deleteGajiKaryawan(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: gajiKaryawanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["gaji", "list"] }); // Invalidate gaji list to update count
      queryClient.invalidateQueries({ queryKey: ["gaji", "detail"] }); // Invalidate gaji detail
      queryClient.invalidateQueries({ queryKey: ["karyawan", "without-gaji"] }); // Invalidate karyawan without gaji
      toast.success(response.message || "Gaji karyawan berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus gaji karyawan");
    },
  });
}

/**
 * Hook untuk batch delete gaji karyawan
 */
export function useBatchDeleteGajiKaryawans() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: (number | string)[]) => gajiKaryawanService.deleteGajiKaryawans(ids),
    onSuccess: (response, ids) => {
      queryClient.invalidateQueries({ queryKey: gajiKaryawanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["gaji", "list"] }); // Invalidate gaji list to update count
      toast.success(
        response.message || `${ids.length} gaji karyawan berhasil dihapus`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus gaji karyawan");
    },
  });
}

