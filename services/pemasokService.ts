import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk data Pemasok (sesuai Prisma schema)
 */
export interface Pemasok {
  id: string; // cuid
  outletId: string;
  nama: string;
  telepon: string | null;
  alamat: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

/**
 * Interface untuk create pemasok
 */
export interface CreatePemasokDto {
  nama: string;
  telepon?: string | null;
  alamat?: string | null;
}

/**
 * Interface untuk update pemasok
 */
export interface UpdatePemasokDto extends Partial<CreatePemasokDto> {
  id: string;
}

/**
 * Interface untuk query parameters dengan pagination dan filter
 */
export interface GetPemasoksParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // Filter params
  nama?: string;
  telepon?: string;
  alamat?: string;
  [key: string]: any; // Untuk filter dinamis
}

/**
 * Service untuk mengelola data Pemasok
 */
export const pemasokService = {
  /**
   * Mendapatkan semua pemasok dengan pagination
   */
  getPemasoks: async (
    params?: GetPemasoksParams
  ): Promise<PaginatedResponse<Pemasok>> => {
    const { page, limit, search, sortBy, sortOrder, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Pemasok>>(
      "/pemasok",
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
   * Mendapatkan pemasok berdasarkan ID
   */
  getPemasokById: async (id: string): Promise<ApiResponse<Pemasok>> => {
    const response = await axiosInstance.get<ApiResponse<Pemasok>>(
      `/pemasok/${id}`
    );
    return response.data;
  },

  /**
   * Membuat pemasok baru
   */
  createPemasok: async (
    data: CreatePemasokDto
  ): Promise<ApiResponse<Pemasok>> => {
    const response = await axiosInstance.post<ApiResponse<Pemasok>>(
      "/pemasok",
      data
    );
    return response.data;
  },

  /**
   * Mengupdate pemasok
   */
  updatePemasok: async (
    data: UpdatePemasokDto
  ): Promise<ApiResponse<Pemasok>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<Pemasok>>(
      `/pemasok/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Menghapus pemasok
   */
  deletePemasok: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/pemasok/${id}`
    );
    return response.data;
  },

  /**
   * Menghapus multiple pemasok (batch delete)
   */
  deletePemasoks: async (ids: string[]): Promise<ApiResponse<void>> => {
    const results = await Promise.allSettled(
      ids.map((id) => pemasokService.deletePemasok(id))
    );
    
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      throw new Error(`${failed.length} pemasok gagal dihapus`);
    }
    
    return {
      success: true,
      message: `${ids.length} pemasok berhasil dihapus`,
    } as ApiResponse<void>;
  },
};
