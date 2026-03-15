import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk data Outlet (untuk relasi)
 */
export interface OutletRelation {
  id: string;
  nama: string;
}

/**
 * Interface untuk data GajiKaryawan (untuk nested relation)
 */
export interface GajiKaryawanRelation {
  id: number;
  gajiId: number;
  karyawanId: string;
  karyawan?: {
    id: string;
    nama: string;
    telepon: string | null;
  };
  deletedAt?: string | Date | null;
}

/**
 * Interface untuk data Gaji (sesuai Prisma schema)
 */
export interface Gaji {
  id: number;
  outletId: string;
  outlet?: OutletRelation;
  nama: string;
  jumlah: number;
  gajiKaryawan?: GajiKaryawanRelation[];
  _count?: {
    gajiKaryawan: number;
  };
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

/**
 * Interface untuk create gaji
 */
export interface CreateGajiDto {
  nama: string;
  jumlah: number | string;
}

/**
 * Interface untuk update gaji
 */
export interface UpdateGajiDto extends Partial<CreateGajiDto> {
  id: number;
}

/**
 * Interface untuk query parameters dengan pagination dan filter
 */
export interface GetGajisParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // Filter params
  nama?: string;
  [key: string]: any; // Untuk filter dinamis
}

/**
 * Service untuk mengelola data Gaji
 */
export const gajiService = {
  /**
   * Mendapatkan semua gaji dengan pagination
   */
  getGajis: async (
    params?: GetGajisParams
  ): Promise<PaginatedResponse<Gaji>> => {
    const { page, limit, search, sortBy, sortOrder, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Gaji>>(
      "/gaji",
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
   * Mendapatkan gaji berdasarkan ID
   */
  getGajiById: async (id: number): Promise<ApiResponse<Gaji>> => {
    const response = await axiosInstance.get<ApiResponse<Gaji>>(
      `/gaji/${id}`
    );
    return response.data;
  },

  /**
   * Membuat gaji baru
   */
  createGaji: async (
    data: CreateGajiDto
  ): Promise<ApiResponse<Gaji>> => {
    // Convert jumlah from string to number if needed
    const payload = {
      ...data,
      jumlah: typeof data.jumlah === "string" ? parseFloat(data.jumlah) : data.jumlah,
    };
    const response = await axiosInstance.post<ApiResponse<Gaji>>(
      "/gaji",
      payload
    );
    return response.data;
  },

  /**
   * Mengupdate gaji
   */
  updateGaji: async (
    data: UpdateGajiDto
  ): Promise<ApiResponse<Gaji>> => {
    const { id, ...updateData } = data;
    // Convert jumlah from string to number if needed
    const payload = {
      ...updateData,
      jumlah: updateData.jumlah && typeof updateData.jumlah === "string" 
        ? parseFloat(updateData.jumlah) 
        : updateData.jumlah,
    };
    const response = await axiosInstance.put<ApiResponse<Gaji>>(
      `/gaji/${id}`,
      payload
    );
    return response.data;
  },

  /**
   * Menghapus gaji
   */
  deleteGaji: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/gaji/${id}`
    );
    return response.data;
  },

  /**
   * Menghapus multiple gaji (batch delete)
   */
  deleteGajis: async (ids: (number | string)[]): Promise<ApiResponse<void>> => {
    const results = await Promise.allSettled(
      ids.map((id) => gajiService.deleteGaji(Number(id)))
    );
    
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      throw new Error(`${failed.length} gaji gagal dihapus`);
    }
    
    return {
      success: true,
      message: `${ids.length} gaji berhasil dihapus`,
    } as ApiResponse<void>;
  },
};

