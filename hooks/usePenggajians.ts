import { useQuery } from "@tanstack/react-query";
import {
  penggajianService,
  type Penggajian,
  type GetPenggajiansParams,
} from "@/services/penggajianService";

/**
 * Hook untuk mendapatkan semua penggajian
 */
export function usePenggajians(params?: GetPenggajiansParams) {
  return useQuery({
    queryKey: ["penggajian", params],
    queryFn: async () => {
      const response = await penggajianService.getPenggajians(params);
      return response;
    },
  });
}

/**
 * Hook untuk mendapatkan penggajian berdasarkan karyawan ID
 */
export function usePenggajianByKaryawan(
  karyawanId: string | null,
  params?: { tanggalFrom?: string; tanggalTo?: string }
) {
  return useQuery({
    queryKey: ["penggajian", "karyawan", karyawanId, params],
    queryFn: async () => {
      if (!karyawanId) return null;
      const response = await penggajianService.getPenggajianByKaryawan(karyawanId, params);
      return response.data;
    },
    enabled: !!karyawanId,
  });
}

