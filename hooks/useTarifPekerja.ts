"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  tarifPekerjaService,
  type CreateTarifPekerjaDto,
  type UpdateTarifPekerjaDto,
  type GetTarifPekerjaParams,
} from "@/services/tarifPekerjaService";

export const tarifPekerjaKeys = {
  all: ["tarif-pekerja"] as const,
  lists: () => [...tarifPekerjaKeys.all, "list"] as const,
  list: (params?: GetTarifPekerjaParams) =>
    [...tarifPekerjaKeys.lists(), params] as const,
  detail: (id: string) => [...tarifPekerjaKeys.all, "detail", id] as const,
};

export type { GetTarifPekerjaParams };

export function useTarifPekerjaList(params?: GetTarifPekerjaParams) {
  return useQuery({
    queryKey: tarifPekerjaKeys.list(params),
    queryFn: () => tarifPekerjaService.getAll(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useTarifPekerja(id: string | null) {
  return useQuery({
    queryKey: tarifPekerjaKeys.detail(id!),
    queryFn: () => tarifPekerjaService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateTarifPekerja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CreateTarifPekerjaDto, "id">) =>
      tarifPekerjaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tarifPekerjaKeys.all });
      toast.success("Tarif pekerja berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          "Gagal menambah tarif"
      );
    },
  });
}

export function useUpdateTarifPekerja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTarifPekerjaDto) =>
      tarifPekerjaService.update(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tarifPekerjaKeys.all });
      queryClient.invalidateQueries({
        queryKey: tarifPekerjaKeys.detail(variables.id),
      });
      toast.success("Tarif pekerja berhasil diperbarui");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          "Gagal memperbarui tarif"
      );
    },
  });
}

export function useDeleteTarifPekerja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tarifPekerjaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tarifPekerjaKeys.all });
      queryClient.invalidateQueries({ queryKey: ["pekerja"] });
      toast.success("Tarif pekerja berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          "Gagal menghapus tarif"
      );
    },
  });
}
