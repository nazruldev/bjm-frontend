import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk user detail (Karyawan/Pekerja/Pemasok)
 */
export interface PiutangUserDetail {
  id: string;
  nama: string;
  telepon?: string | null;
  alamat?: string | null;
  type?: string; // Untuk Pekerja
}

/**
 * Interface untuk invoice piutang
 */
export interface PiutangInvoice {
  id: string;
  invoice: string;
  total: number;
  dibayar: number;
  status: "PENDING" | "APPROVED" | "AKTIF" | "PARTIAL" | "LUNAS" | "DIBATALKAN";
  outletId?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  approvedBy?: {
    id: string;
    nama: string;
  } | null;
  confirmedBy?: {
    id: string;
    nama: string;
  } | null;
}

/**
 * Interface untuk data Piutang grouped by subjek (dari getAllByUser)
 */
export interface PiutangGrouped {
  subjekId: string;
  subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  user: PiutangUserDetail | null;
  totalPiutang: number;
  totalDibayar: number;
  sisaPiutang: number;
  jumlahInvoice: number;
}

/**
 * Interface untuk detail piutang per subjek (dari getByUser)
 */
export interface PiutangDetail {
  subjekId: string;
  subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  user: PiutangUserDetail | null;
  invoices: PiutangInvoice[];
}

/**
 * Interface untuk data Piutang lengkap (dari getById)
 */
export interface Piutang {
  id: string;
  invoice: string;
  subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  subjekId: string;
  total: number;
  dibayar: number;
  status: "PENDING" | "AKTIF" | "PARTIAL" | "LUNAS" | "DIBATALKAN";
  outletId: string;
  outlet?: {
    id: string;
    nama: string;
    alamat?: string | null;
    telepon?: string | null;
  };
  approvedBy?: {
    id: string;
    nama: string;
  } | null;
  confirmedBy?: {
    id: string;
    nama: string;
  } | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Interface untuk create piutang
 */
export interface CreatePiutangDto {
  subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  subjekId: string;
  total: number;
  dibayar?: number;
  createdAt?: string;
}

/**
 * Interface untuk bayar piutang
 */
export interface BayarPiutangDto {
  subjekId: string;
  subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  totalBayar: number;
  isCashless?: boolean;
  rekeningId?: string | null;
  catatan?: string | null;
}

/**
 * Interface untuk query parameters getAllByUser
 */
export interface GetPiutangsParams {
  page?: number;
  limit?: number;
  subjekType?: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  [key: string]: any;
}

/**
 * Interface untuk query parameters getByUser
 */
export interface GetPiutangDetailParams {
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
 * Service untuk mengelola data Piutang
 */
export const piutangService = {
  /**
   * Mendapatkan semua piutang grouped by subjek dengan pagination
   */
  getPiutangs: async (
    params?: GetPiutangsParams
  ): Promise<PaginatedResponse<PiutangGrouped>> => {
    const { page, limit, ...filterParams } = params || {};

    const response = await axiosInstance.get<PaginatedResponse<PiutangGrouped>>(
      "/piutang",
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
   * Mendapatkan detail piutang untuk subjek tertentu
   */
  getPiutangDetail: async (
    params: GetPiutangDetailParams
  ): Promise<PaginatedResponse<PiutangDetail>> => {
    const { page, limit, ...filterParams } = params;

    const response = await axiosInstance.get<PaginatedResponse<PiutangDetail>>(
      "/piutang/user/detail",
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
   * Mendapatkan piutang berdasarkan ID
   */
  getPiutangById: async (id: string): Promise<ApiResponse<Piutang>> => {
    const response = await axiosInstance.get<ApiResponse<Piutang>>(
      `/piutang/${id}`
    );
    return response.data;
  },

  /**
   * Membuat piutang baru
   */
  createPiutang: async (
    data: CreatePiutangDto
  ): Promise<ApiResponse<Piutang>> => {
    const response = await axiosInstance.post<ApiResponse<Piutang>>(
      "/piutang",
      data
    );
    return response.data;
  },

  /**
   * Membayar piutang
   */
  bayarPiutang: async (data: BayarPiutangDto): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post<ApiResponse<any>>(
      "/piutang/bayar",
      data
    );
    return response.data;
  },

  /**
   * Menghapus piutang
   */
  deletePiutang: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/piutang/${id}`
    );
    return response.data;
  },

  /**
   * Mendapatkan semua invoice pending
   */
  getPendingInvoices: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<
    PaginatedResponse<
      PiutangInvoice & {
        subjekId: string;
        subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
        outletId?: string;
        user: PiutangUserDetail | null;
      }
    >
  > => {
    const { page, limit } = params || {};

    const response = await axiosInstance.get<
      PaginatedResponse<
        PiutangInvoice & {
          subjekId: string;
          subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
          user: PiutangUserDetail | null;
        }
      >
    >("/piutang/all?status=PENDING,APPROVED", {
      params: {
        page: page || 1,
        limit: limit || 10,
      },
    });
    return response.data;
  },

  /**
   * Mendapatkan count piutang berdasarkan status
   */
  getCountByStatus: async (params?: {
    status?: string | string[]; // Comma-separated string atau array
    subjekType?: "KARYAWAN" | "PEKERJA" | "PEMASOK";
    subjekId?: string;
  }): Promise<
    ApiResponse<{
      [status: string]: number;
    }> & {
      summary?: Array<{ status: string; count: number }>;
    }
  > => {
    const { status, subjekType, subjekId } = params || {};
    
    // Convert array to comma-separated string if needed
    // Default to PENDING if status not provided
    const statusParam = status
      ? (Array.isArray(status) ? status.join(",") : status)
      : "PENDING";

    const response = await axiosInstance.get<
      ApiResponse<{
        [status: string]: number;
      }> & {
        summary?: Array<{ status: string; count: number }>;
      }
    >("/piutang/count", {
      params: {
        status: statusParam,
        ...(subjekType && { subjekType }),
        ...(subjekId && { subjekId }),
      },
    });
    return response.data;
  },

  /**
   * Approve atau batalkan piutang (untuk OWNER)
   */
  approvePiutang: async (
    id: string,
    data: { outletId: string; status: "APPROVED" | "DIBATALKAN" }
  ): Promise<ApiResponse<Piutang>> => {
    const response = await axiosInstance.post<ApiResponse<Piutang>>(
      `/piutang/${id}/confirm-owner`,
      data
    );
    return response.data;
  },

  /**
   * Confirm piutang (untuk ADMIN) - mengubah dari APPROVED ke AKTIF
   */
  confirmPiutang: async (
    id: string,
    data: {
      outletId: string;
      isCashless?: boolean;
      rekeningId?: string | null;
    }
  ): Promise<ApiResponse<Piutang>> => {
    const response = await axiosInstance.post<ApiResponse<Piutang>>(
      `/piutang/${id}/confirm`,
      data
    );
    return response.data;
  },

  /**
   * Resend WhatsApp notification untuk piutang dengan status PENDING
   */
  resendNotification: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post<ApiResponse<any>>(
      `/piutang/${id}/resend-notification`
    );
    return response.data;
  },
};
