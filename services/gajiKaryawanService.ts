import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk data Gaji (untuk relasi)
 */
export interface GajiRelation {
  id: number;
  nama: string;
  jumlah: number;
}

/**
 * Interface untuk data Karyawan (untuk relasi)
 */
export interface KaryawanRelation {
  id: string;
  nama: string;
  telepon: string | null;
}

/**
 * Interface untuk data GajiKaryawan (sesuai Prisma schema)
 */
export interface GajiKaryawan {
  id: number; // number, bukan string
  gajiId: number;
  karyawanId: string;
  userId?: string | null;
  gaji?: GajiRelation;
  karyawan?: KaryawanRelation;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

/**
 * Interface untuk create gaji karyawan
 */
export interface CreateGajiKaryawanDto {
  gajiId: number | string; // Accept string for form input
  karyawanId: string;
  userId?: string | null;
}

/**
 * Interface untuk update gaji karyawan
 */
export interface UpdateGajiKaryawanDto extends Partial<CreateGajiKaryawanDto> {
  id: number;
}

/**
 * Interface untuk query parameters dengan pagination dan filter
 */
export interface GetGajiKaryawansParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // Filter params
  gajiId?: number | string;
  karyawanId?: string;
  userId?: string;
  [key: string]: any; // Untuk filter dinamis
}

/**
 * Service untuk mengelola data GajiKaryawan
 */
export const gajiKaryawanService = {
  /**
   * Mendapatkan semua gaji karyawan dengan pagination
   */
  getGajiKaryawans: async (
    params?: GetGajiKaryawansParams
  ): Promise<PaginatedResponse<GajiKaryawan>> => {
    const { page, limit, search, sortBy, sortOrder, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<GajiKaryawan>>(
      "/gaji-karyawan",
      {
        params: {
          page: page || 1,
          limit: limit || 10,
          search,
          sortBy,
          sortOrder,
          ...filterParams,
        },
      }
    );
    return response.data;
  },

  /**
   * Mendapatkan gaji karyawan berdasarkan ID
   */
  getGajiKaryawanById: async (id: number): Promise<ApiResponse<GajiKaryawan>> => {
    const response = await axiosInstance.get<ApiResponse<GajiKaryawan>>(
      `/gaji-karyawan/${id}`
    );
    return response.data;
  },

  /**
   * Membuat gaji karyawan baru
   */
  createGajiKaryawan: async (
    data: CreateGajiKaryawanDto
  ): Promise<ApiResponse<GajiKaryawan>> => {
    // Convert gajiId from string to number if needed
    const payload = {
      ...data,
      gajiId: typeof data.gajiId === "string" ? parseInt(data.gajiId) : data.gajiId,
    };
    const response = await axiosInstance.post<ApiResponse<GajiKaryawan>>(
      "/gaji-karyawan",
      payload
    );
    return response.data;
  },

  /**
   * Mengupdate gaji karyawan
   */
  updateGajiKaryawan: async (
    data: UpdateGajiKaryawanDto
  ): Promise<ApiResponse<GajiKaryawan>> => {
    const { id, ...updateData } = data;
    // Convert gajiId from string to number if needed
    const payload = {
      ...updateData,
      gajiId: updateData.gajiId && typeof updateData.gajiId === "string" 
        ? parseInt(updateData.gajiId) 
        : updateData.gajiId,
    };
    const response = await axiosInstance.put<ApiResponse<GajiKaryawan>>(
      `/gaji-karyawan/${id}`,
      payload
    );
    return response.data;
  },

  /**
   * Menghapus gaji karyawan
   */
  deleteGajiKaryawan: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/gaji-karyawan/${id}`
    );
    return response.data;
  },

  /**
   * Menghapus multiple gaji karyawan (batch delete)
   */
  deleteGajiKaryawans: async (ids: (number | string)[]): Promise<ApiResponse<void>> => {
    const results = await Promise.allSettled(
      ids.map((id) => gajiKaryawanService.deleteGajiKaryawan(Number(id)))
    );
    
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      throw new Error(`${failed.length} gaji karyawan gagal dihapus`);
    }
    
    return {
      success: true,
      message: `${ids.length} gaji karyawan berhasil dihapus`,
    } as ApiResponse<void>;
  },
};

