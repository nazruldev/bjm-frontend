"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  keuanganService,
  type CreateKeuanganDto,
  type UpdateKeuanganDto,
  type GetKeuangansParams,
} from "@/services/keuanganService";
import { pembayaranKeys } from "./usePembayarans";

export const keuanganKeys = {
  all: ["keuangan"] as const,
  lists: () => [...keuanganKeys.all, "list"] as const,
  list: (params?: GetKeuangansParams) =>
    [...keuanganKeys.lists(), params] as const,
  details: () => [...keuanganKeys.all, "detail"] as const,
  detail: (id: string) => [...keuanganKeys.details(), id] as const,
};

export function useKeuangans(params?: GetKeuangansParams) {
  return useQuery({
    queryKey: keuanganKeys.list(params),
    queryFn: () => keuanganService.getKeuangans(params),
    staleTime: 30 * 1000,
  });
}

export function useKeuangan(id: string | null) {
  return useQuery({
    queryKey: keuanganKeys.detail(id!),
    queryFn: () => keuanganService.getKeuanganById(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateKeuangan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateKeuanganDto) =>
      keuanganService.createKeuangan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keuanganKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.summary() });
      toast.success("Keuangan berhasil dibuat");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Gagal membuat transaksi keuangan"
      );
    },
  });
}

export function useUpdateKeuangan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKeuanganDto }) =>
      keuanganService.updateKeuangan(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: keuanganKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: keuanganKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.summary() });
      toast.success("Keuangan berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Gagal mengupdate keuangan"
      );
    },
  });
}

export function useDeleteKeuangan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => keuanganService.deleteKeuangan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keuanganKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.summary() });
      toast.success("Keuangan berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Gagal menghapus keuangan"
      );
    },
  });
}
