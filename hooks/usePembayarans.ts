"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  pembayaranService,
  type GetPembayaransParams,
  type CreatePembayaranDto,
  type UpdatePembayaranDto,
} from "@/services/pembayaranService";

/**
 * Query keys untuk pembayaran
 */
export const pembayaranKeys = {
  all: ["pembayaran"] as const,
  lists: () => [...pembayaranKeys.all, "list"] as const,
  list: (params?: GetPembayaransParams) =>
    [...pembayaranKeys.lists(), params] as const,
  byId: (id: string) => [...pembayaranKeys.all, "byId", id] as const,
  summary: (params?: any) => [...pembayaranKeys.all, "summary", params] as const,
};

/**
 * Hook untuk mendapatkan list pembayaran dengan pagination
 */
export function usePembayarans(params?: GetPembayaransParams) {
  return useQuery({
    queryKey: pembayaranKeys.list(params),
    queryFn: () => pembayaranService.getPembayarans(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan pembayaran berdasarkan ID
 */
export function usePembayaran(id: string | null) {
  return useQuery({
    queryKey: pembayaranKeys.byId(id!),
    queryFn: () => pembayaranService.getPembayaranById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan summary pembayaran
 */
export function usePembayaranSummary(
  params?: {
    tanggal?: number;
    bulan?: number;
    tahun?: number;
    dateFrom?: string;
    dateTo?: string;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: pembayaranKeys.summary(params),
    queryFn: () => pembayaranService.getSummary(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  });
}

/**
 * Hook untuk membuat pembayaran baru
 */
export function useCreatePembayaran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePembayaranDto) => pembayaranService.createPembayaran(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.summary() });
      toast.success(response.message || "Pembayaran berhasil dibuat");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal membuat pembayaran");
    },
  });
}

/**
 * Hook untuk update pembayaran
 */
export function useUpdatePembayaran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePembayaranDto }) =>
      pembayaranService.updatePembayaran(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.summary() });
      toast.success(response.message || "Pembayaran berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate pembayaran");
    },
  });
}

/**
 * Hook untuk menghapus pembayaran
 */
export function useDeletePembayaran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pembayaranService.deletePembayaran(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.summary() });
      toast.success(response.message || "Pembayaran berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus pembayaran");
    },
  });
}

