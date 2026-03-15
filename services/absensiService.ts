import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk data Absensi
 */
export type SumberAbsensi = "ALAT" | "MANUAL";

export interface Absensi {
  id: string;
  karyawanId: string;
  tanggal: string | Date;
  jam_masuk: string;
  jam_keluar?: string | null;
  total_jam?: number | null;
  catatan?: string | null;
  sumberAbsensi?: SumberAbsensi | null;
  penggajianId?: string | null;
  status?: "HADIR" | "TIDAK_HADIR";
  createdAt?: string | Date;
  updatedAt?: string | Date;
  karyawan?: {
    id: string;
    nama: string;
    telepon?: string;
    gaji?: {
      id: string;
      nama: string;
      jumlah: number;
    };
  };
}

/**
 * Interface untuk create absensi
 * tanggal: YYYY-MM-DD, jam_masuk & jam_keluar: HH:mm
 */
export interface CreateAbsensiDto {
  karyawanId: string;
  tanggal: string;
  jam_masuk: string;
  jam_keluar?: string | null;
  catatan?: string | null;
}

/**
 * Interface untuk update absensi
 * jam_masuk & jam_keluar: HH:mm
 */
export interface UpdateAbsensiDto {
  jam_masuk?: string;
  jam_keluar?: string | null;
  catatan?: string | null;
}

/**
 * Interface untuk query parameters
 */
export interface GetAbsensisParams {
  page?: number;
  limit?: number;
  karyawanId?: string;
  tanggalFrom?: string;
  tanggalTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any;
}

/**
 * Service untuk mengelola data Absensi
 */
export const absensiService = {
  /**
   * Mendapatkan semua absensi dengan pagination
   */
  getAbsensis: async (
    params?: GetAbsensisParams
  ): Promise<PaginatedResponse<Absensi>> => {
    const { page, limit, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Absensi>>(
      "/absensi",
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
   * Mendapatkan absensi berdasarkan ID
   */
  getAbsensiById: async (id: string): Promise<ApiResponse<Absensi>> => {
    const response = await axiosInstance.get<ApiResponse<Absensi>>(
      `/absensi/${id}`
    );
    return response.data;
  },

  /**
   * Mendapatkan absensi berdasarkan karyawan ID
   */
  getAbsensiByKaryawan: async (
    karyawanId: string,
    params?: { tanggalFrom?: string; tanggalTo?: string }
  ): Promise<ApiResponse<Absensi[]>> => {
    const response = await axiosInstance.get<ApiResponse<Absensi[]>>(
      `/absensi/karyawan/${karyawanId}`,
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Membuat absensi baru
   */
  createAbsensi: async (
    data: CreateAbsensiDto
  ): Promise<ApiResponse<Absensi>> => {
    const response = await axiosInstance.post<ApiResponse<Absensi>>(
      "/absensi",
      data
    );
    return response.data;
  },

  /**
   * Mengupdate absensi
   */
  updateAbsensi: async (
    id: string,
    data: UpdateAbsensiDto
  ): Promise<ApiResponse<Absensi>> => {
    const response = await axiosInstance.put<ApiResponse<Absensi>>(
      `/absensi/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Menghapus absensi
   */
  deleteAbsensi: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/absensi/${id}`
    );
    return response.data;
  },

  deleteAbsensiBatch: async (
    ids: (string | number)[]
  ): Promise<ApiResponse<{ deleted: number; skipped: { id: string; reason: string }[] }>> => {
    const response = await axiosInstance.post<
      ApiResponse<{ deleted: number; skipped: { id: string; reason: string }[] }>
    >("/absensi/batch-delete", { ids: ids.map(String) });
    return response.data;
  },
};

