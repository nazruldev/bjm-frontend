import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk ProduksiInput
 */
export interface ProduksiInput {
  id: string;
  produksiId: string;
  produkId: string;
  jumlah: number;
  produk?: {
    id: string;
    nama_produk: string;
    satuan: string;
  };
}

/**
 * Interface untuk ProduksiOutput
 */
export interface ProduksiOutput {
  id: string;
  produksiId: string;
  produkId: string;
  jumlah: number;
  produk?: {
    id: string;
    nama_produk: string;
    satuan: string;
  };
}

/**
 * Interface untuk data Produksi
 */
export interface Produksi {
  id: string;
  tipe_proses: "JEMUR" | "KUPAS" | "SORTIR";
  status: "BERJALAN" | "SELESAI" | "DIBATALKAN";
  tanggal_mulai: string | Date;
  tanggal_selesai?: string | Date | null;
  input: ProduksiInput[];
  output: ProduksiOutput[];
  penjemuran?: {
    id: string;
    invoice: string;
    pekerjaId: string;
    upah_satuan: number;
    total_upah?: number | null;
    susut_percentage?: number | null;
    susut_jumlah?: number | null;
    catatan?: string | null;
  } | null;
  pengupasan?: {
    id: string;
    invoice: string;
    pekerjaId: string;
    upah_satuan: number;
    total_upah?: number | null;
    catatan?: string | null;
  } | null;
  sortir?: {
    id: string;
    code: string;
    inspectorId: string;
    catatan?: string | null;
  } | null;
}

/**
 * Interface untuk create produksi
 */
export interface CreateProduksiDto {
  tipe_proses: "JEMUR" | "KUPAS" | "SORTIR";
  tanggal_mulai?: string | Date;
  input: Array<{
    produkId: string;
    jumlah: number;
  }>;
  output: Array<{
    produkId: string;
    jumlah: number;
  }>;
}

/**
 * Interface untuk update produksi
 */
export interface UpdateProduksiDto {
  id: string;
  status?: "BERJALAN" | "SELESAI" | "DIBATALKAN";
  tanggal_selesai?: string | Date | null;
  input?: Array<{
    produkId: string;
    jumlah: number;
  }>;
  output?: Array<{
    produkId: string;
    jumlah: number;
  }>;
}

/**
 * Interface untuk query parameters
 */
export interface GetProduksisParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  tipe_proses?: "JEMUR" | "KUPAS" | "SORTIR";
  status?: "BERJALAN" | "SELESAI" | "DIBATALKAN";
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

/**
 * Service untuk mengelola data Produksi
 */
export const produksiService = {
  /**
   * Mendapatkan semua produksi dengan pagination
   */
  getProduksis: async (
    params?: GetProduksisParams
  ): Promise<PaginatedResponse<Produksi>> => {
    const {
      page,
      limit,
      search,
      orderBy,
      orderDirection,
      dateFrom,
      dateTo,
      ...filterParams
    } = params || {};

    const response = await axiosInstance.get<PaginatedResponse<Produksi>>(
      "/produksi",
      {
        params: {
          page: page || 1,
          limit: limit || 10,
          search,
          orderBy,
          orderDirection,
          dateFrom,
          dateTo,
          ...filterParams,
        },
      }
    );
    return response.data;
  },

  /**
   * Mendapatkan produksi berdasarkan ID
   */
  getProduksiById: async (id: string): Promise<ApiResponse<Produksi>> => {
    const response = await axiosInstance.get<ApiResponse<Produksi>>(
      `/produksi/${id}`
    );
    return response.data;
  },

  /**
   * Membuat produksi baru
   */
  createProduksi: async (
    data: CreateProduksiDto
  ): Promise<ApiResponse<Produksi>> => {
    const response = await axiosInstance.post<ApiResponse<Produksi>>(
      "/produksi",
      data
    );
    return response.data;
  },

  /**
   * Mengupdate produksi
   */
  updateProduksi: async (
    data: UpdateProduksiDto
  ): Promise<ApiResponse<Produksi>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<Produksi>>(
      `/produksi/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Menghapus produksi
   */
  deleteProduksi: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/produksi/${id}`
    );
    return response.data;
  },

  /**
   * Mendapatkan summary produksi
   */
  getSummary: async (params?: Omit<GetProduksisParams, "page" | "limit">) => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      "/produksi/summary",
      {
        params,
      }
    );
    return response.data;
  },
};

