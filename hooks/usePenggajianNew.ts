import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import {
  penggajianNewService,
  type Penggajian,
  type GroupedPenggajian,
  type GetPenggajiansParams,
  type GeneratePenggajianDto,
  type BatchPaymentDto,
  type SinglePaymentDto,
} from "@/services/penggajianNewService";
import { toast } from "sonner";

/**
 * Hook untuk generate penggajian
 */
export function useGeneratePenggajian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GeneratePenggajianDto) => {
      const response = await penggajianNewService.generatePenggajian(data);
      return response.data; // Return array of penggajian results
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["penggajian-new"] });
      // Don't show success toast here, let the component handle it based on skipped items
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Gagal generate penggajian";
      toast.error(message);
    },
  });
}

/**
 * Hook untuk mendapatkan semua penggajian
 */
export function usePenggajiansNew(params?: GetPenggajiansParams) {
  return useQuery({
    queryKey: ["penggajian-new", params],
    queryFn: async () => {
      const response = await penggajianNewService.getPenggajians(params);
      return response;
    },
  });
}

/**
 * Hook untuk mendapatkan penggajian grouped by karyawan
 */
export function useGroupedPenggajians(params?: { periodeBulan?: number; periodeTahun?: number }) {
  return useQuery({
    queryKey: ["penggajian-new", "grouped", params?.periodeBulan, params?.periodeTahun],
    queryFn: async () => {
      const response = await penggajianNewService.getGroupedPenggajians(params);
      return response.data;
    },
    enabled: true, // Always enabled
  });
}

/**
 * Hook untuk mendapatkan penggajian berdasarkan karyawan ID dengan infinite scroll
 */
export function usePenggajianByKaryawan(
  karyawanId: string | null,
  params?: { periodeBulan?: number; periodeTahun?: number }
) {
  return useInfiniteQuery({
    queryKey: ["penggajian-new", "karyawan", karyawanId, params],
    queryFn: async ({ pageParam = 1 }) => {
      if (!karyawanId) {
        return {
          data: [],
          meta: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }
      const response = await penggajianNewService.getPenggajianByKaryawan(karyawanId, {
        ...params,
        page: pageParam as number,
        limit: 10,
      });
      return response;
    },
          getNextPageParam: (lastPage) => {
            if (!lastPage) return undefined;
            // Check if it's a paginated response with meta
            if ('meta' in lastPage && lastPage.meta) {
              const { page, totalPages } = lastPage.meta;
              return page < totalPages ? page + 1 : undefined;
            }
            return undefined;
          },
    initialPageParam: 1,
    enabled: !!karyawanId,
  });
}

/**
 * Hook untuk batch payment
 */
export function useBatchPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BatchPaymentDto) => {
      const response = await penggajianNewService.batchPayment(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penggajian-new"] });
      queryClient.invalidateQueries({ queryKey: ["pembayaran"] });
      toast.success("Pembayaran gaji batch berhasil");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Gagal melakukan batch payment";
      toast.error(message);
    },
  });
}

/**
 * Hook untuk single payment
 */
export function useSinglePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ penggajianId, data }: { penggajianId: string; data: SinglePaymentDto }) => {
      const response = await penggajianNewService.singlePayment(penggajianId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penggajian-new"] });
      queryClient.invalidateQueries({ queryKey: ["pembayaran"] });
      toast.success("Pembayaran gaji berhasil");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Gagal melakukan pembayaran";
      toast.error(message);
    },
  });
}

/**
 * Hook untuk mendapatkan satu penggajian berdasarkan ID
 */
export function usePenggajianById(id: string | null) {
  return useQuery({
    queryKey: ["penggajian-new", "detail", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await penggajianNewService.getPenggajianById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

