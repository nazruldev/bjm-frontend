"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  hutangService,
  type GetHutangsParams,
  type GetHutangDetailParams,
  type BayarHutangDto,
} from "@/services/hutangService";

/**
 * Query keys untuk hutang
 */
export const hutangKeys = {
  all: ["hutang"] as const,
  lists: () => [...hutangKeys.all, "list"] as const,
  list: (params?: GetHutangsParams) =>
    [...hutangKeys.lists(), params] as const,
  details: () => [...hutangKeys.all, "detail"] as const,
  detail: (params: GetHutangDetailParams) =>
    [...hutangKeys.details(), params] as const,
  byId: (id: string) => [...hutangKeys.all, "byId", id] as const,
};

/**
 * Hook untuk mendapatkan list hutang grouped by subjek dengan pagination
 */
export function useHutangs(params?: GetHutangsParams) {
  return useQuery({
    queryKey: hutangKeys.list(params),
    queryFn: () => hutangService.getHutangs(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail hutang untuk subjek tertentu
 */
export function useHutangDetail(params: GetHutangDetailParams | null) {
  return useQuery({
    queryKey: hutangKeys.detail(params!),
    queryFn: () => hutangService.getHutangDetail(params!),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan hutang berdasarkan ID
 */
export function useHutang(id: string | null) {
  return useQuery({
    queryKey: hutangKeys.byId(id!),
    queryFn: () => hutangService.getHutangById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk membayar hutang
 */
export function useBayarHutang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BayarHutangDto) => hutangService.bayarHutang(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: hutangKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: hutangKeys.details(),
      });
      const msg = response.message || "Pembayaran hutang berhasil";
      const waSent =
        (response as { waSent?: boolean; data?: { waSent?: boolean } }).waSent === true ||
        (response as { data?: { waSent?: boolean } }).data?.waSent === true;
      const alreadyMentionsWa = /whatsapp|terkirim/i.test(msg);
      toast.success(waSent && !alreadyMentionsWa ? `${msg} WhatsApp terkirim ke owner.` : msg);
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal membayar hutang");
    },
  });
}

/**
 * Hook untuk menghapus hutang
 */
export function useDeleteHutang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => hutangService.deleteHutang(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: hutangKeys.lists() });
      queryClient.invalidateQueries({ queryKey: hutangKeys.details() });
      toast.success(response.message || "Hutang berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus hutang");
    },
  });
}


/**
 * Query keys untuk count by status
 */
export const hutangCountKeys = {
  all: ["hutang", "count"] as const,
  detail: (params?: {
    status?: string | string[];
    subjekType?: "KARYAWAN" | "PEKERJA" | "PEMASOK";
    subjekId?: string;
  }) => [...hutangCountKeys.all, params] as const,
};

/**
 * Hook untuk mendapatkan count hutang berdasarkan status
 */
export function useHutangCountByStatus(params: {
  status: string | string[];
  subjekType?: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  subjekId?: string;
}) {
  return useQuery({
    queryKey: hutangCountKeys.detail(params),
    queryFn: () => hutangService.getCountByStatus(params),
    staleTime: 2 * 60 * 1000, // 2 menit
    gcTime: 5 * 60 * 1000, // 5 menit
  });
}

