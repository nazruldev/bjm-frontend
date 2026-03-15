import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

export interface DetailPenjualan {
  id: string;
  produkId: string;
  jumlah: number;
  harga: number;
  subtotal: number;
  produk?: {
    id: string;
    nama_produk: string;
    satuan: string;
  };
}

export interface Penjualan {
  id: string;
  invoice: string;
  outletId: string;
  pelangganId?: string | null;
  biayaKirim?: number | null;
  total: number;
  catatan?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  outlet?: { id: string; nama: string; alamat?: string | null; telepon?: string | null; logo?: string | null };
  pelanggan?: { id: string; nama: string; telepon?: string | null; alamat?: string | null } | null;
  pengiriman?: PengirimanOnPenjualan | null;
  createdBy?: { id: string; nama: string; email: string } | null;
  detail: DetailPenjualan[];
  mutasiStok?: any[];
}

export interface PengirimanOnPenjualan {
  id: string;
  status: string;
  alamatKirim?: string | null;
  namaKurir?: string | null;
  nomorKurir?: string | null;
  namaPenerima?: string | null;
  nomorPenerima?: string | null;
  nomorSuratJalan?: string | null;
  jenisKendaraan?: string | null;
  warnaKendaraan?: string | null;
  nomorKendaraan?: string | null;
  tanggalMulaiPengiriman?: string | null;
}

export interface CreatePenjualanDto {
  invoice?: string;
  total: number;
  pelangganId?: string | null;
  biayaKirim?: number | null;
  catatan?: string | null;
  createdAt?: string;
  detail: Array<{
    produkId: string;
    jumlah: number;
    harga: number;
    subtotal: number;
  }>;
}

export interface GetPenjualansParams {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
  search?: string;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export const penjualanService = {
  getPenjualans: async (
    params?: GetPenjualansParams
  ): Promise<PaginatedResponse<Penjualan>> => {
    const { page, limit, ...rest } = params || {};
    const response = await axiosInstance.get<PaginatedResponse<Penjualan>>(
      "/penjualan",
      { params: { page: page || 1, limit: limit || 10, ...rest } }
    );
    return response.data;
  },

  getPenjualanById: async (id: string): Promise<ApiResponse<Penjualan>> => {
    const response = await axiosInstance.get<ApiResponse<Penjualan>>(
      `/penjualan/${id}`
    );
    return response.data;
  },

  createPenjualan: async (
    data: CreatePenjualanDto
  ): Promise<ApiResponse<Penjualan>> => {
    const response = await axiosInstance.post<ApiResponse<Penjualan>>(
      "/penjualan",
      data
    );
    return response.data;
  },

  deletePenjualan: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/penjualan/${id}`
    );
    return response.data;
  },

  getSummary: async (params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{ totalPenjualan: number; totalValue: number }>> => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      "/penjualan/summary",
      { params }
    );
    return response.data;
  },
};
