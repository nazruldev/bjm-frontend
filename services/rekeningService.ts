import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk data Rekening (sesuai Prisma schema)
 */
export interface Rekening {
  id: string; // cuid
  outletId: string;
  bank: string;
  nama: string;
  nomor: string;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Interface untuk create rekening
 */
export interface CreateRekeningDto {
  bank: string;
  nama: string;
  nomor: string;
  isActive?: boolean;
}

/**
 * Interface untuk update rekening
 */
export interface UpdateRekeningDto extends Partial<CreateRekeningDto> {
  id: string;
}

/**
 * Interface untuk query parameters dengan pagination dan filter
 */
export interface GetRekeningsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // Filter params
  isActive?: boolean | string;
  bank?: string;
  nama?: string;
  nomor?: string;
  [key: string]: any; // Untuk filter dinamis
}

/**
 * Service untuk mengelola data Rekening
 */
export const rekeningService = {
  /**
   * Mendapatkan semua rekening dengan pagination
   */
  getRekenings: async (
    params?: GetRekeningsParams
  ): Promise<PaginatedResponse<Rekening>> => {
    const { page, limit, search, sortBy, sortOrder, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Rekening>>(
      "/rekening",
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
   * Mendapatkan rekening berdasarkan ID
   */
  getRekeningById: async (id: string): Promise<ApiResponse<Rekening>> => {
    const response = await axiosInstance.get<ApiResponse<Rekening>>(
      `/rekening/${id}`
    );
    return response.data;
  },

  /**
   * Membuat rekening baru
   */
  createRekening: async (
    data: CreateRekeningDto
  ): Promise<ApiResponse<Rekening>> => {
    const response = await axiosInstance.post<ApiResponse<Rekening>>(
      "/rekening",
      data
    );
    return response.data;
  },

  /**
   * Mengupdate rekening
   */
  updateRekening: async (
    data: UpdateRekeningDto
  ): Promise<ApiResponse<Rekening>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<Rekening>>(
      `/rekening/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Menghapus rekening
   */
  deleteRekening: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/rekening/${id}`
    );
    return response.data;
  },

  /**
   * Menghapus multiple rekening (batch delete)
   */
  deleteRekenings: async (ids: string[]): Promise<ApiResponse<void>> => {
    const results = await Promise.allSettled(
      ids.map((id) => rekeningService.deleteRekening(id))
    );
    
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      throw new Error(`${failed.length} rekening gagal dihapus`);
    }
    
    return {
      success: true,
      message: `${ids.length} rekening berhasil dihapus`,
    } as ApiResponse<void>;
  },
};