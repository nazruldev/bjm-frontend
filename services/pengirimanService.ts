import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

export interface PengirimanPenjualan {
  id: string;
  invoice: string;
  total: number;
  pelanggan?: { id: string; nama: string; telepon?: string | null; alamat?: string | null } | null;
}

export interface Pengiriman {
  id: string;
  penjualanId: string;
  jenisKendaraan?: string | null;
  warnaKendaraan?: string | null;
  nomorKendaraan?: string | null;
  status: string;
  nomorSuratJalan?: string | null;
  alamatKirim?: string | null;
  namaKurir?: string | null;
  nomorKurir?: string | null;
  namaPenerima?: string | null;
  nomorPenerima?: string | null;
  tanggalMulaiPengiriman?: string | null;
  createdAt: string;
  updatedAt: string;
  penjualan?: PengirimanPenjualan;
}

export interface CreatePengirimanDto {
  penjualanId: string;
  jenisKendaraan?: string | null;
  warnaKendaraan?: string | null;
  nomorKendaraan?: string | null;
  status?: string;
  nomorSuratJalan?: string | null;
  alamatKirim?: string | null;
  namaKurir?: string | null;
  nomorKurir?: string | null;
  namaPenerima?: string | null;
  nomorPenerima?: string | null;
  tanggalMulaiPengiriman?: string | null;
}

export type UpdatePengirimanDto = Partial<Omit<CreatePengirimanDto, "penjualanId">>;

export interface GetPengirimansParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export const pengirimanService = {
  getPengirimans: async (
    params?: GetPengirimansParams
  ): Promise<PaginatedResponse<Pengiriman>> => {
    const { page, limit, status, search } = params || {};
    const response = await axiosInstance.get<PaginatedResponse<Pengiriman>>(
      "/pengiriman",
      { params: { page: page || 1, limit: limit || 10, status, search } }
    );
    return response.data;
  },

  getPengirimanById: async (id: string): Promise<ApiResponse<Pengiriman>> => {
    const response = await axiosInstance.get<ApiResponse<Pengiriman>>(
      `/pengiriman/${id}`
    );
    return response.data;
  },

  createPengiriman: async (
    data: CreatePengirimanDto
  ): Promise<ApiResponse<Pengiriman>> => {
    const response = await axiosInstance.post<ApiResponse<Pengiriman>>(
      "/pengiriman",
      data
    );
    return response.data;
  },

  updatePengiriman: async (
    id: string,
    data: UpdatePengirimanDto
  ): Promise<ApiResponse<Pengiriman>> => {
    const response = await axiosInstance.put<ApiResponse<Pengiriman>>(
      `/pengiriman/${id}`,
      data
    );
    return response.data;
  },
};
