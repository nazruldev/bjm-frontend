import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  pengirimanService,
  type Pengiriman,
  type CreatePengirimanDto,
  type UpdatePengirimanDto,
  type GetPengirimansParams,
} from "@/services/pengirimanService";
import { toast } from "sonner";

export function usePengirimans(params?: GetPengirimansParams) {
  return useQuery({
    queryKey: ["pengirimans", params],
    queryFn: async () => pengirimanService.getPengirimans(params),
  });
}

export function usePengiriman(id: string | null) {
  return useQuery({
    queryKey: ["pengiriman", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await pengirimanService.getPengirimanById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreatePengiriman() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePengirimanDto) => {
      const res = await pengirimanService.createPengiriman(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengirimans"] });
      queryClient.invalidateQueries({ queryKey: ["penjualans"] });
      toast.success("Pengiriman berhasil dibuat");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || "Gagal membuat pengiriman";
      toast.error(msg);
    },
  });
}

export function useUpdatePengiriman() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: { id: string; data: UpdatePengirimanDto }) => {
      const res = await pengirimanService.updatePengiriman(id, data);
      return res.data;
    },
    onSuccess: (updated: Pengiriman) => {
      queryClient.invalidateQueries({ queryKey: ["pengirimans"] });
      queryClient.invalidateQueries({ queryKey: ["pengiriman", updated?.id] });
      queryClient.invalidateQueries({ queryKey: ["penjualans"] });
      toast.success("Pengiriman berhasil diperbarui");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || "Gagal memperbarui pengiriman";
      toast.error(msg);
    },
  });
}
