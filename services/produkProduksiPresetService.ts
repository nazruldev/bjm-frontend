import axiosInstance, { type PaginatedResponse, type ApiResponse } from "@/lib/axios";

/**
 * Tipe data untuk ProdukProduksiOutputPreset
 */
export interface ProdukProduksiOutputPreset {
  id: string;
  ProdukProduksiPresetId: string;
  produkOutputId: string;
  produkOutput: {
    id: string;
    nama_produk: string;
    satuan: string;
  };
}

/**
 * Tipe data untuk ProdukProduksiPreset
 */
export interface ProdukProduksiPreset {
  id: string;
  nama: string;
  tipeProses: "JEMUR" | "KUPAS" | "SORTIR";
  produkInputId: string;
  produkInput: {
    id: string;
    nama_produk: string;
    satuan: string;
  };
  outputPreset: ProdukProduksiOutputPreset[];
  isDefault: boolean;
}

/**
 * DTO untuk membuat ProdukProduksiPreset
 */
export interface CreateProdukProduksiPresetDto {
  nama: string;
  tipeProses: "JEMUR" | "KUPAS" | "SORTIR";
  produkInputId: string;
  isDefault?: boolean;
  outputPreset?: Array<{
    produkOutputId: string;
  }>;
}

/**
 * DTO untuk mengupdate ProdukProduksiPreset
 */
export interface UpdateProdukProduksiPresetDto {
  id: string;
  nama?: string;
  isDefault?: boolean;
  outputPreset?: Array<{
    produkOutputId: string;
  }>;
}

/**
 * Parameter untuk mendapatkan list ProdukProduksiPreset
 */
export interface GetProdukProduksiPresetsParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  tipeProses?: "JEMUR" | "KUPAS" | "SORTIR";
  isDefault?: boolean;
  [key: string]: any;
}

/**
 * Service untuk mengelola data ProdukProduksiPreset
 */
export const produkProduksiPresetService = {
  /**
   * Mendapatkan semua preset dengan pagination
   */
  getProdukProduksiPresets: async (
    params?: GetProdukProduksiPresetsParams
  ): Promise<PaginatedResponse<ProdukProduksiPreset>> => {
    const { page, limit, search, orderBy, orderDirection, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<ProdukProduksiPreset>>(
      "/produk/presets",
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
   * Mendapatkan preset berdasarkan ID
   */
  getProdukProduksiPresetById: async (id: string): Promise<ApiResponse<ProdukProduksiPreset>> => {
    const response = await axiosInstance.get<ApiResponse<ProdukProduksiPreset>>(
      `/produk/presets/${id}`
    );
    return response.data;
  },

  /**
   * Membuat preset baru
   */
  createProdukProduksiPreset: async (
    data: CreateProdukProduksiPresetDto
  ): Promise<ApiResponse<ProdukProduksiPreset>> => {
    const response = await axiosInstance.post<ApiResponse<ProdukProduksiPreset>>(
      "/produk/presets",
      data
    );
    return response.data;
  },

  /**
   * Mengupdate preset
   */
  updateProdukProduksiPreset: async (
    data: UpdateProdukProduksiPresetDto
  ): Promise<ApiResponse<ProdukProduksiPreset>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<ProdukProduksiPreset>>(
      `/produk/presets/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Menghapus preset
   */
  deleteProdukProduksiPreset: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/produk/presets/${id}`
    );
    return response.data;
  },
};

