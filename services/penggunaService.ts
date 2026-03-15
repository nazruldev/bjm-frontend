import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk data Outlet (untuk relasi)
 */
export interface OutletRelation {
  id: string;
  nama: string;
}

/**
 * Interface untuk data Pengguna (sesuai Prisma schema)
 */
export interface Pengguna {
  id: string; // cuid
  outletId: string | null;
  outlet: OutletRelation | null;
  email: string;
  nama: string;
  role: "ADMIN" | "KASIR" | "INSPECTOR" | "OWNER";
  telepon?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

/**
 * Interface untuk create pengguna
 */
export interface CreatePenggunaDto {
  email: string;
  password: string;
  nama: string;
  role?: "ADMIN" | "KASIR" | "INSPECTOR" | "OWNER";
  telepon?: string | null;
  outletId?: string | null;
}

/**
 * Interface untuk update pengguna
 */
export interface UpdatePenggunaDto extends Partial<CreatePenggunaDto> {
  id: string;
}

/**
 * Interface untuk query parameters dengan pagination dan filter
 */
export interface GetPenggunasParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // Filter params
  email?: string;
  nama?: string;
  role?: "ADMIN" | "KASIR" | "INSPECTOR" | "OWNER" | string;
  outletId?: string;
  [key: string]: any; // Untuk filter dinamis
}

/**
 * Service untuk mengelola data Pengguna
 */
export const penggunaService = {
  /**
   * Mendapatkan semua pengguna dengan pagination
   */
  getPenggunas: async (
    params?: GetPenggunasParams
  ): Promise<PaginatedResponse<Pengguna>> => {
    const { page, limit, search, sortBy, sortOrder, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Pengguna>>(
      "/pengguna",
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
   * Mendapatkan pengguna berdasarkan ID
   */
  getPenggunaById: async (id: string): Promise<ApiResponse<Pengguna>> => {
    const response = await axiosInstance.get<ApiResponse<Pengguna>>(
      `/pengguna/${id}`
    );
    return response.data;
  },

  /**
   * Membuat pengguna baru
   */
  createPengguna: async (
    data: CreatePenggunaDto
  ): Promise<ApiResponse<Pengguna>> => {
    const response = await axiosInstance.post<ApiResponse<Pengguna>>(
      "/pengguna",
      data
    );
    return response.data;
  },

  /**
   * Mengupdate pengguna
   */
  updatePengguna: async (
    data: UpdatePenggunaDto
  ): Promise<ApiResponse<Pengguna>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<Pengguna>>(
      `/pengguna/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Menghapus pengguna
   */
  deletePengguna: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/pengguna/${id}`
    );
    return response.data;
  },

  /**
   * Menghapus multiple pengguna (batch delete)
   */
  deletePenggunas: async (ids: string[]): Promise<ApiResponse<void>> => {
    const results = await Promise.allSettled(
      ids.map((id) => penggunaService.deletePengguna(id))
    );
    
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      throw new Error(`${failed.length} pengguna gagal dihapus`);
    }
    
    return {
      success: true,
      message: `${ids.length} pengguna berhasil dihapus`,
    } as ApiResponse<void>;
  },
};