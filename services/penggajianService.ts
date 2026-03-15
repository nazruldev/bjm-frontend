import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk data Penggajian
 */
export interface Penggajian {
  karyawan: {
    id: string;
    nama: string;
    telepon?: string;
    gaji?: {
      id: string;
      nama: string;
      jumlah: number;
    } | null;
  };
  periode: {
    dari: string | Date;
    sampai: string | Date;
  };
  totalJam: number;
  gajiPerJam: number;
  totalGaji: number;
  jumlahAbsensi: number;
  gajiNama?: string;
  absensi?: Array<{
    id: string;
    tanggal: string | Date;
    jam_masuk: string | Date;
    jam_keluar?: string | Date | null;
    total_jam?: number | null;
  }>;
  message?: string;
}

/**
 * Interface untuk query parameters
 */
export interface GetPenggajiansParams {
  page?: number;
  limit?: number;
  tanggalFrom?: string;
  tanggalTo?: string;
  [key: string]: any;
}

/**
 * Service untuk mengelola data Penggajian
 */
export const penggajianService = {
  /**
   * Mendapatkan semua penggajian dengan pagination
   */
  getPenggajians: async (
    params?: GetPenggajiansParams
  ): Promise<PaginatedResponse<Penggajian>> => {
    const { page, limit, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Penggajian>>(
      "/penggajian",
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
   * Mendapatkan penggajian berdasarkan karyawan ID
   */
  getPenggajianByKaryawan: async (
    karyawanId: string,
    params?: { tanggalFrom?: string; tanggalTo?: string }
  ): Promise<ApiResponse<Penggajian>> => {
    const response = await axiosInstance.get<ApiResponse<Penggajian>>(
      `/penggajian/karyawan/${karyawanId}`,
      {
        params,
      }
    );
    return response.data;
  },
};

