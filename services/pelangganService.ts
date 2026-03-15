import axiosInstance, { ApiResponse } from "@/lib/axios";

export interface Pelanggan {
  id: string;
  nama: string;
  telepon?: string | null;
  alamat?: string | null;
}

export const pelangganService = {
  getPelanggans: async (params?: { search?: string; limit?: number }): Promise<ApiResponse<Pelanggan[]>> => {
    const response = await axiosInstance.get<ApiResponse<Pelanggan[]>>("/pelanggan", {
      params: params || {},
    });
    return response.data;
  },
};
