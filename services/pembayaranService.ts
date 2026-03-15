import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk data Pembayaran
 */
export interface SumberInvoice {
  type: "PIUTANG" | "HUTANG" | "PENGGAJIAN" | "PENGELUARAN" | "PEMBELIAN" | "PENJEMURAN" | "PENJUALAN" | "PENGUPASAN" | "MANUAL";
  id: string;
  invoice: string;
  total: number;
  dibayar: number;
  status: "PENDING" | "AKTIF" | "PARTIAL" | "LUNAS" | "DIBATALKAN" | "SELESAI" | "BERJALAN";
  subjekType?: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  subjekId?: string;
}

export interface Pembayaran {
  id: string;
  invoice: string;
  sumberType: string;
  sumberId: string;
  total: number;
  arus: "MASUK" | "KELUAR";
  isCashless: boolean;
  rekeningId?: string | null;
  rekening?: {
    id: string;
    bank: string;
    nama: string;
    nomor?: string;
  } | null;
  catatan?: string | null;
  outletId: string;
  createdById?: string | null;
  createdBy?: { id: string; nama: string; email?: string; role?: string } | null;
  tanggal: number;
  bulan: number;
  tahun: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  sumberInvoice?: SumberInvoice | null;
}

/**
 * Interface untuk query parameters
 */
export interface GetPembayaransParams {
  page?: number;
  limit?: number;
  sumberType?: string;
  sumberId?: string;
  arus?: "MASUK" | "KELUAR";
  isCashless?: boolean;
  rekeningId?: string;
  bulan?: number;
  tahun?: number;
  tanggal?: number;
  // Date range filter
  dateField?: "createdAt" | "updatedAt";
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  // Total range
  totalMin?: number;
  totalMax?: number;
  // Order by
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  search?: string;
  [key: string]: any;
}

/**
 * Interface untuk create pembayaran
 */
export interface CreatePembayaranDto {
  invoice?: string;
  sumberType: "PIUTANG" | "HUTANG" | "PENGGAJIAN" | "PENGELUARAN" | "PEMBELIAN" | "PENJEMURAN" | "PENJUALAN" | "PENGUPASAN" | "MANUAL";
  sumberId?: string | null;
  total: number;
  arus: "MASUK" | "KELUAR";
  isCashless?: boolean;
  rekeningId?: string | null;
  catatan?: string | null;
  tanggal?: number;
  bulan?: number;
  tahun?: number;
}

/**
 * Interface untuk update pembayaran
 */
export interface UpdatePembayaranDto {
  total?: number;
  catatan?: string | null;
  tanggal?: number;
  bulan?: number;
  tahun?: number;
}

/**
 * Interface untuk summary pembayaran
 */
export interface PembayaranSummary {
  totalMasuk: number;
  totalKeluar: number;
  saldo: number;
  totalPembayaran: number;
}

/**
 * Service untuk mengelola data Pembayaran
 */
export const pembayaranService = {
  /**
   * Mendapatkan semua pembayaran dengan pagination
   */
  getPembayarans: async (
    params?: GetPembayaransParams
  ): Promise<PaginatedResponse<Pembayaran>> => {
    const { page, limit, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Pembayaran>>(
      "/pembayaran",
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
   * Mendapatkan pembayaran berdasarkan ID
   */
  getPembayaranById: async (id: string): Promise<ApiResponse<Pembayaran>> => {
    const response = await axiosInstance.get<ApiResponse<Pembayaran>>(
      `/pembayaran/${id}`
    );
    return response.data;
  },

  /**
   * Membuat pembayaran baru
   */
  createPembayaran: async (
    data: CreatePembayaranDto
  ): Promise<ApiResponse<Pembayaran>> => {
    const response = await axiosInstance.post<ApiResponse<Pembayaran>>(
      "/pembayaran",
      data
    );
    return response.data;
  },

  /**
   * Update pembayaran
   */
  updatePembayaran: async (
    id: string,
    data: UpdatePembayaranDto
  ): Promise<ApiResponse<Pembayaran>> => {
    const response = await axiosInstance.put<ApiResponse<Pembayaran>>(
      `/pembayaran/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Menghapus pembayaran
   */
  deletePembayaran: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete<ApiResponse<any>>(
      `/pembayaran/${id}`
    );
    return response.data;
  },

  /**
   * Mendapatkan summary pembayaran
   */
  getSummary: async (params?: {
    tanggal?: number;
    bulan?: number;
    tahun?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<PembayaranSummary>> => {
    const response = await axiosInstance.get<ApiResponse<PembayaranSummary>>(
      "/pembayaran/summary",
      {
        params,
      }
    );
    return response.data;
  },
};

