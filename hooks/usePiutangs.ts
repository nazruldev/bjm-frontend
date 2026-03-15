"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  piutangService,
  type CreatePiutangDto,
  type GetPiutangsParams,
  type GetPiutangDetailParams,
  type BayarPiutangDto,
} from "@/services/piutangService";

/**
 * Query keys untuk piutang
 */
export const piutangKeys = {
  all: ["piutang"] as const,
  lists: () => [...piutangKeys.all, "list"] as const,
  list: (params?: GetPiutangsParams) =>
    [...piutangKeys.lists(), params] as const,
  details: () => [...piutangKeys.all, "detail"] as const,
  detail: (params: GetPiutangDetailParams) =>
    [...piutangKeys.details(), params] as const,
  byId: (id: string) => [...piutangKeys.all, "byId", id] as const,
};

/**
 * Hook untuk mendapatkan list piutang grouped by subjek dengan pagination
 */
export function usePiutangs(params?: GetPiutangsParams) {
  return useQuery({
    queryKey: piutangKeys.list(params),
    queryFn: () => piutangService.getPiutangs(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan detail piutang untuk subjek tertentu
 */
export function usePiutangDetail(params: GetPiutangDetailParams | null) {
  return useQuery({
    queryKey: piutangKeys.detail(params!),
    queryFn: () => piutangService.getPiutangDetail(params!),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk mendapatkan piutang berdasarkan ID
 */
export function usePiutang(id: string | null) {
  return useQuery({
    queryKey: piutangKeys.byId(id!),
    queryFn: () => piutangService.getPiutangById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk membuat piutang baru
 */
export function useCreatePiutang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePiutangDto) => piutangService.createPiutang(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: piutangKeys.lists() });
      toast.success(response.message || "Kasbon berhasil dibuat");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal membuat kasbon");
    },
  });
}

/**
 * Hook untuk membayar piutang
 */
export function useBayarPiutang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BayarPiutangDto) => piutangService.bayarPiutang(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: piutangKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: piutangKeys.details(),
      });
      toast.success(response.message || "Pembayaran kasbon berhasil");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal membayar kasbon");
    },
  });
}

/**
 * Hook untuk menghapus piutang
 */
export function useDeletePiutang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => piutangService.deletePiutang(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: piutangKeys.lists() });
      queryClient.invalidateQueries({ queryKey: piutangKeys.details() });
      toast.success(response.message || "Kasbon berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus kasbon");
    },
  });
}

/**
 * Query keys untuk pending invoices
 */
export const pendingInvoiceKeys = {
  all: ["piutang", "pending"] as const,
  lists: () => [...pendingInvoiceKeys.all, "list"] as const,
  list: (params?: { page?: number; limit?: number }) =>
    [...pendingInvoiceKeys.lists(), params] as const,
};

/**
 * Hook untuk mendapatkan semua invoice pending
 */
export function usePendingInvoices(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: pendingInvoiceKeys.list(params),
    queryFn: () => piutangService.getPendingInvoices(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Query keys untuk count by status
 */
export const piutangCountKeys = {
  all: ["piutang", "count"] as const,
  byStatus: (params?: {
    status?: string | string[];
    subjekType?: "KARYAWAN" | "PEKERJA" | "PEMASOK";
    subjekId?: string;
  }) => [...piutangCountKeys.all, params] as const,
};

/**
 * Hook untuk mendapatkan count piutang berdasarkan status
 */
export function usePiutangCountByStatus(params?: {
  status?: string | string[];
  subjekType?: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  subjekId?: string;
}) {
  return useQuery({
    queryKey: piutangCountKeys.byStatus(params),
    queryFn: () => piutangService.getCountByStatus(params),
    staleTime: 2 * 60 * 1000, // 2 menit
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk approve atau batalkan piutang (untuk OWNER)
 */
export function useApprovePiutang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      outletId,
      status,
    }: {
      id: string;
      outletId: string;
      status: "APPROVED" | "DIBATALKAN";
    }) => piutangService.approvePiutang(id, { outletId, status }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: piutangKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pendingInvoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: piutangCountKeys.all });
      toast.success(response.message || "Kasbon berhasil dikonfirmasi");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengkonfirmasi kasbon");
    },
  });
}

/**
 * Hook untuk confirm piutang (untuk ADMIN) - mengubah dari APPROVED ke AKTIF
 */
export function useConfirmPiutang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      outletId,
      isCashless,
      rekeningId,
    }: {
      id: string;
      outletId: string;
      isCashless?: boolean;
      rekeningId?: string | null;
    }) =>
      piutangService.confirmPiutang(id, {
        outletId,
        isCashless,
        rekeningId,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: piutangKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pendingInvoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: piutangCountKeys.all });
      toast.success(response.message || "Kasbon berhasil dikonfirmasi");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengkonfirmasi kasbon");
    },
  });
}

/**
 * Hook untuk resend WhatsApp notification untuk piutang PENDING
 */
export function useResendPiutangNotification() {
  return useMutation({
    mutationFn: (id: string) => piutangService.resendNotification(id),
    onSuccess: (response) => {
      toast.success(response.message || "Notifikasi WhatsApp berhasil dikirim ulang ke owner");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengirim ulang notifikasi");
    },
  });
}

