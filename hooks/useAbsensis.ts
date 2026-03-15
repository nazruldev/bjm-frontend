import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  absensiService,
  type Absensi,
  type CreateAbsensiDto,
  type UpdateAbsensiDto,
  type GetAbsensisParams,
} from "@/services/absensiService";
import { toast } from "sonner";

/**
 * Hook untuk mendapatkan semua absensi
 */
export function useAbsensis(params?: GetAbsensisParams) {
  return useQuery({
    queryKey: ["absensi", params],
    queryFn: async () => {
      const response = await absensiService.getAbsensis(params);
      return response;
    },
  });
}

/**
 * Hook untuk mendapatkan absensi berdasarkan ID
 */
export function useAbsensi(id: string | null) {
  return useQuery({
    queryKey: ["absensi", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await absensiService.getAbsensiById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook untuk mendapatkan absensi berdasarkan karyawan ID
 */
export function useAbsensiByKaryawan(
  karyawanId: string | null,
  params?: { tanggalFrom?: string; tanggalTo?: string }
) {
  return useQuery({
    queryKey: ["absensi", "karyawan", karyawanId, params],
    queryFn: async () => {
      if (!karyawanId) return null;
      const response = await absensiService.getAbsensiByKaryawan(karyawanId, params);
      return response.data;
    },
    enabled: !!karyawanId,
  });
}

/**
 * Hook untuk create absensi
 */
export function useCreateAbsensi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAbsensiDto) => {
      const response = await absensiService.createAbsensi(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
      toast.success("Absensi berhasil dibuat");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Gagal membuat absensi";
      toast.error(message);
    },
  });
}

/**
 * Hook untuk update absensi
 */
export function useUpdateAbsensi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAbsensiDto;
    }) => {
      const response = await absensiService.updateAbsensi(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
      toast.success("Absensi berhasil diupdate");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Gagal mengupdate absensi";
      toast.error(message);
    },
  });
}

/**
 * Hook untuk delete absensi
 */
export function useDeleteAbsensi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await absensiService.deleteAbsensi(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
      toast.success("Absensi berhasil dihapus");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Gagal menghapus absensi";
      toast.error(message);
    },
  });
}

/**
 * Hook untuk batch delete absensi
 */
export function useDeleteAbsensiBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: (string | number)[]) => {
      const response = await absensiService.deleteAbsensiBatch(ids);
      return response.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
      const d = (res as any)?.data;
      const msg =
        d?.skipped?.length > 0
          ? `${d?.deleted ?? 0} absensi dihapus, ${d.skipped.length} dilewati (sudah payroll/alat)`
          : "Absensi berhasil dihapus";
      toast.success(msg);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Gagal menghapus absensi";
      toast.error(message);
    },
  });
}

