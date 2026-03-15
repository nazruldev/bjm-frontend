import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk data Pekerja (sesuai Prisma schema + include tarifPekerja)
 */
export interface TarifPekerjaRef {
  id: string;
  nama: string | null;
  tipe: "PENJEMUR" | "PENGUPAS";
  tarifPerKg: number | string;
}

export interface Pekerja {
  id: string; // cuid
  outletId: string;
  nama: string;
  telepon: string | null;
  alamat: string | null;
  type: "PENJEMUR" | "PENGUPAS";
  tarifPekerjaId?: string | null;
  tarifPekerja?: TarifPekerjaRef | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

/**
 * Interface untuk create pekerja
 */
export interface CreatePekerjaDto {
  nama: string;
  telepon?: string | null;
  alamat?: string | null;
  type: "PENJEMUR" | "PENGUPAS";
  tarifPekerjaId?: string | null;
}

/**
 * Interface untuk update pekerja
 */
export interface UpdatePekerjaDto extends Partial<CreatePekerjaDto> {
  id: string;
}

/**
 * Interface untuk query parameters dengan pagination dan filter
 */
export interface GetPekerjasParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // Filter params
  type?: "PENJEMUR" | "PENGUPAS";
  nama?: string;
  telepon?: string;
  alamat?: string;
  [key: string]: any; // Untuk filter dinamis
}

/**
 * Service untuk mengelola data Pekerja
 */
export const pekerjaService = {
  /**
   * Mendapatkan semua pekerja dengan pagination
   */
  getPekerjas: async (
    params?: GetPekerjasParams
  ): Promise<PaginatedResponse<Pekerja>> => {
    const { page, limit, search, sortBy, sortOrder, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Pekerja>>(
      "/pekerja",
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
   * Mendapatkan pekerja berdasarkan ID
   */
  getPekerjaById: async (id: string): Promise<ApiResponse<Pekerja>> => {
    const response = await axiosInstance.get<ApiResponse<Pekerja>>(
      `/pekerja/${id}`
    );
    return response.data;
  },

  /**
   * Membuat pekerja baru
   */
  createPekerja: async (
    data: CreatePekerjaDto
  ): Promise<ApiResponse<Pekerja>> => {
    const response = await axiosInstance.post<ApiResponse<Pekerja>>(
      "/pekerja",
      data
    );
    return response.data;
  },

  /**
   * Mengupdate pekerja
   */
  updatePekerja: async (
    data: UpdatePekerjaDto
  ): Promise<ApiResponse<Pekerja>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<Pekerja>>(
      `/pekerja/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Menghapus pekerja
   */
  deletePekerja: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/pekerja/${id}`
    );
    return response.data;
  },

  /**
   * Menghapus multiple pekerja (batch delete)
   */
  deletePekerjas: async (ids: string[]): Promise<ApiResponse<void>> => {
    const results = await Promise.allSettled(
      ids.map((id) => pekerjaService.deletePekerja(id))
    );
    
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      throw new Error(`${failed.length} pekerja gagal dihapus`);
    }
    
    return {
      success: true,
      message: `${ids.length} pekerja berhasil dihapus`,
    } as ApiResponse<void>;
  },
};
