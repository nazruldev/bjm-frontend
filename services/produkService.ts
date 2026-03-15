import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk ProdukProses
 */
export interface ProdukProses {
  id: string;
  produkId: string;
  tipe_proses: "JEMUR" | "KUPAS" | "SORTIR";
  isInput: boolean;
}

/**
 * Interface untuk data Produk (sesuai Prisma schema)
 */
export interface Produk {
  ids: string;
  id: string; // cuid
  nama_produk: string;
  satuan: string;
  bisa_dijual: boolean;
  bisa_dibeli: boolean;
  isInput: boolean;
  isOutput: boolean;
  harga_jual: number | null;
  isPermanent?: boolean;
  created_at: string | Date;
  deletedAt?: string | Date | null;
  proses?: ProdukProses[];
}

/**
 * Interface untuk create produk
 */
export interface CreateProdukDto {
  nama_produk: string;
  satuan?: string;
  bisa_dijual?: boolean;
  bisa_dibeli?: boolean;
  harga_jual?: number | null;
  proses?: Array<{
    tipe_proses: "JEMUR" | "KUPAS" | "SORTIR";
    isInput: boolean;
  }>;
}

/**
 * Interface untuk update produk
 */
export interface UpdateProdukDto extends Partial<CreateProdukDto> {
  id: string;
}

/**
 * Interface untuk query parameters dengan pagination dan filter
 */
export interface GetProduksParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  // Filter params
  bisa_dijual?: boolean;
  bisa_dibeli?: boolean;
  [key: string]: any; // Untuk filter dinamis
}

/**
 * Service untuk mengelola data Produk
 */
export const produkService = {
  /**
   * Mendapatkan semua produk dengan pagination
   */
  getProduks: async (
    params?: GetProduksParams
  ): Promise<PaginatedResponse<Produk>> => {
    const { page, limit, search, orderBy, orderDirection, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Produk>>(
      "/produk",
      {
        params: {
          page: page || 1,
          limit: limit || 10,
          search,
          orderBy,
          orderDirection,
          ...filterParams,
        },
      }
    );
    return response.data;
  },

  /**
   * Mendapatkan produk berdasarkan ID
   */
  getProdukById: async (id: string): Promise<ApiResponse<Produk>> => {
    const response = await axiosInstance.get<ApiResponse<Produk>>(
      `/produk/${id}`
    );
    return response.data;
  },

  /**
   * Membuat produk baru
   */
  createProduk: async (
    data: CreateProdukDto
  ): Promise<ApiResponse<Produk>> => {
    const response = await axiosInstance.post<ApiResponse<Produk>>(
      "/produk",
      data
    );
    return response.data;
  },

  /**
   * Mengupdate produk
   */
  updateProduk: async (
    data: UpdateProdukDto
  ): Promise<ApiResponse<Produk>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<Produk>>(
      `/produk/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Menghapus produk (soft delete)
   */
  deleteProduk: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/produk/${id}`
    );
    return response.data;
  },

  /**
   * Menghapus multiple produk (batch delete)
   */
  deleteProduks: async (ids: string[]): Promise<ApiResponse<void>> => {
    const results = await Promise.allSettled(
      ids.map((id) => produkService.deleteProduk(id))
    );
    
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      throw new Error(`${failed.length} produk gagal dihapus`);
    }
    
    return {
      success: true,
      message: `${ids.length} produk berhasil dihapus`,
    } as ApiResponse<void>;
  },
};
