import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

export interface DetailPembelian {
  id: string;
  produkId: string;
  jumlah: number;
  harga?: number | null;
  subtotal: number;
  produk?: {
    id: string;
    nama_produk: string;
    satuan: string;
  };
}

export interface Pembelian {
  id: string;
  invoice: string;
  pemasokId?: string | null;
  outletId: string;
  total: number;
  jumlahBayar?: number | null;
  statusPembayaran?: "LUNAS" | "MENUNGGU_APPROVAL" | "DITOLAK";
  catatan?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  outlet?: {
    id: string;
    nama: string;
  };
  pemasok?: {
    id: string;
    nama: string;
    telepon?: string | null;
    alamat?: string | null;
  } | null;
  createdBy?: {
    id: string;
    nama: string;
    email: string;
  } | null;
  detail: DetailPembelian[];
  mutasiStok?: any[];
  pembayaran?: any[];
}

export interface CreatePembelianDto {
  invoice?: string;
  pemasokId?: string | null;
  total: number;
  catatan?: string | null;
  createdAt?: string;
  detail: Array<{
    produkId: string;
    jumlah: number;
    harga?: number | null;
    subtotal: number;
  }>;
  /** Jumlah yang dibayar saat ini. Jika tidak dikirim atau sama dengan total pembayaran = lunas. Jika kurang = sisa jadi hutang (wajib ada pemasok). */
  jumlahBayar?: number;
  /** Ongkos bongkar/timbang; total pembayaran = total - ongkosBongkarTimbang */
  ongkosBongkarTimbang?: number;
  isCashless?: boolean;
  rekeningId?: string | null;
}

export interface GetPembeliansParams {
  page?: number;
  limit?: number;
  pemasokId?: string;
  createdById?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
  totalMin?: string;
  totalMax?: string;
  search?: string;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export const pembelianService = {
  /**
   * Mendapatkan semua pembelian dengan pagination
   */
  getPembelians: async (
    params?: GetPembeliansParams
  ): Promise<PaginatedResponse<Pembelian>> => {
    const { page, limit, ...filterParams } = params || {};
    const response = await axiosInstance.get<PaginatedResponse<Pembelian>>(
      "/pembelian",
      {
        params: {
          page: page || 1,
          limit: limit || 10,
          ...filterParams,
        },
      }
    );
    return response.data;
  },

  /**
   * Mendapatkan pembelian by ID
   */
  getPembelianById: async (id: string): Promise<ApiResponse<Pembelian>> => {
    const response = await axiosInstance.get<ApiResponse<Pembelian>>(
      `/pembelian/${id}`
    );
    return response.data;
  },

  /**
   * Membuat pembelian baru
   */
  createPembelian: async (
    data: CreatePembelianDto
  ): Promise<ApiResponse<Pembelian>> => {
    const response = await axiosInstance.post<ApiResponse<Pembelian>>(
      "/pembelian",
      data
    );
    return response.data;
  },

  /**
   * Delete pembelian
   */
  deletePembelian: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/pembelian/${id}`
    );
    return response.data;
  },

  /**
   * Get summary pembelian
   */
  getSummary: async (params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      "/pembelian/summary",
      { params }
    );
    return response.data;
  },
};


