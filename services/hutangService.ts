import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk user detail (Karyawan/Pekerja/Pemasok)
 */
export interface HutangUserDetail {
  id: string;
  nama: string;
  telepon?: string | null;
  alamat?: string | null;
  type?: string; // Untuk Pekerja
}

/**
 * Interface untuk invoice hutang
 */
export interface HutangInvoice {
  id: string;
  invoice: string;
  total: number;
  dibayar: number;
  status: "AKTIF" | "PARTIAL" | "LUNAS" | "DIBATALKAN";
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Interface untuk data Hutang grouped by subjek (dari getAllByUser)
 */
export interface HutangGrouped {
  subjekId: string;
  subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  user: HutangUserDetail | null;
  totalHutang: number;
  totalDibayar: number;
  sisaHutang: number;
  jumlahInvoice: number;
}

/**
 * Interface untuk detail hutang per subjek (dari getByUser)
 */
export interface HutangDetail {
  subjekId: string;
  subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  user: HutangUserDetail | null;
  invoices: HutangInvoice[];
}

/**
 * Interface untuk data Hutang lengkap (dari getById)
 */
export interface Hutang {
  id: string;
  invoice: string;
  subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  subjekId: string;
  total: number;
  dibayar: number;
  status: "AKTIF" | "PARTIAL" | "LUNAS" | "DIBATALKAN";
  outletId: string;
  outlet?: {
    id: string;
    nama: string;
    alamat?: string | null;
    telepon?: string | null;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Interface untuk bayar hutang
 */
export interface BayarHutangDto {
  subjekId: string;
  subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  totalBayar: number;
  isCashless?: boolean;
  rekeningId?: string | null; // Rekening sumber (bukan tujuan)
  catatan?: string | null;
}

/**
 * Interface untuk query parameters getAllByUser
 */
export interface GetHutangsParams {
  page?: number;
  limit?: number;
  subjekType?: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  subjekId?: string;
  search?: string;
  [key: string]: any;
}

/**
 * Interface untuk query parameters getByUser
 */
export interface GetHutangDetailParams {
  subjekId: string;
  subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  page?: number;
  limit?: number;
  // New format
  dateField?: "createdAt" | "updatedAt";
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  status?: string | string[]; // Comma-separated string atau array
  totalMin?: number;
  totalMax?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  // Backward compatible
  bulan?: number;
  tahun?: number;
  search?: string;
  [key: string]: any;
}

/**
 * Interface untuk get count by status params
 */
export interface GetHutangCountParams {
  status: string | string[];
  subjekType?: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  subjekId?: string;
}

/**
 * Service untuk mengelola data Hutang
 */
export const hutangService = {
  /**
   * Mendapatkan semua hutang grouped by subjek dengan pagination
   */
  getHutangs: async (
    params?: GetHutangsParams
  ): Promise<PaginatedResponse<HutangGrouped>> => {
    const { page, limit, ...filterParams } = params || {};

    const response = await axiosInstance.get<PaginatedResponse<HutangGrouped>>(
      "/hutang",
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
   * Mendapatkan detail hutang untuk subjek tertentu
   */
  getHutangDetail: async (
    params: GetHutangDetailParams
  ): Promise<PaginatedResponse<HutangDetail>> => {
    const { page, limit, ...filterParams } = params;

    const response = await axiosInstance.get<PaginatedResponse<HutangDetail>>(
      "/hutang/user/detail",
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
   * Mendapatkan hutang berdasarkan ID
   */
  getHutangById: async (id: string): Promise<ApiResponse<Hutang>> => {
    const response = await axiosInstance.get<ApiResponse<Hutang>>(
      `/hutang/${id}`
    );
    return response.data;
  },

  /**
   * Membayar hutang
   */
  bayarHutang: async (data: BayarHutangDto): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post<ApiResponse<any>>(
      "/hutang/bayar",
      data
    );
    return response.data;
  },

  /**
   * Menghapus hutang
   */
  deleteHutang: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete<ApiResponse<any>>(
      `/hutang/${id}`
    );
    return response.data;
  },


  /**
   * Mendapatkan count hutang berdasarkan status
   */
  getCountByStatus: async (
    params: GetHutangCountParams
  ): Promise<ApiResponse<Record<string, number>>> => {
    const { status, ...filterParams } = params;
    const statusParam = Array.isArray(status) ? status.join(",") : status;
    const response = await axiosInstance.get<
      ApiResponse<Record<string, number>>
    >("/hutang/count", {
      params: {
        status: statusParam,
        ...filterParams,
      },
    });
    return response.data;
  },
};

