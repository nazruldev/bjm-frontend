import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk relasi Produk
 */
export interface ProdukRelation {
  id: string;
  nama_produk: string;
  satuan: string;
}

/**
 * Interface untuk relasi Penjemuran
 */
export interface PenjemuranRelation {
  id: string;
  invoice?: string | null;
  status: string;
  tanggal_mulai: string | Date;
  tanggal_selesai?: string | Date | null;
  ProdukProduksiPreset?: {
    id: string;
    nama: string;
    tipeProses: string;
  };
}

/**
 * Interface untuk relasi Pembelian
 */
export interface PembelianRelation {
  id: string;
  invoice: string;
  total?: number;
  createdAt?: string | Date;
  pemasok?: {
    id: string;
    nama: string;
  } | null;
}

/**
 * Interface untuk data MutasiStok (sesuai Prisma schema)
 */
export interface MutasiStok {
  pengupasanId: string | null | undefined;
  pensortiranId: any;
  penjualanId: any;
  id: string; // cuid
  produkId: string;
  jumlah: number;
  tipe: "MASUK" | "KELUAR" | "SUSUT" | "HILANG" | "RUSAK";
  tanggal: string | Date;
  penjemuranId?: string | null;
  pembelianId?: string | null;
  keterangan?: string | null;
  produk?: ProdukRelation;
  penjemuran?: PenjemuranRelation | null;
  pembelian?: PembelianRelation | null;
}

/**
 * Interface untuk create mutasi stok
 */
export interface CreateMutasiStokDto {
  produkId: string;
  jumlah: number;
  tipe: "MASUK" | "KELUAR" | "SUSUT" | "HILANG" | "RUSAK";
  tanggal?: string | Date;
  penjemuranId?: string | null;
  pembelianId?: string | null;
  keterangan?: string | null;
}

/**
 * Interface untuk update mutasi stok
 */
export interface UpdateMutasiStokDto extends Partial<CreateMutasiStokDto> {
  id: string;
}

/**
 * Interface untuk query parameters dengan pagination dan filter
 */
export interface GetMutasiStoksParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  // Filter params
  produkId?: string;
  tipe?: "MASUK" | "KELUAR" | "SUSUT" | "HILANG" | "RUSAK";
  penjemuranId?: string;
  pembelianId?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
  [key: string]: any;
}

/**
 * Interface untuk response getByProduk
 */
export interface MutasiStokByProdukResponse {
  data: MutasiStok[];
  pagination: any;
  saldo: {
    masuk: number;
    keluar: number;
    susut: number;
    hilang: number;
    rusak: number;
    saldoAkhir: number;
  };
}

/**
 * Interface untuk produk dengan stok (grouped by produk)
 */
export interface ProdukWithStok {
  id: string;
  nama_produk: string;
  satuan: string;
  bisa_dijual: boolean;
  bisa_dibeli: boolean;
  harga_jual?: number | null;
  stok: {
    masuk: number;
    keluar: number;
    susut: number;
    hilang: number;
    rusak: number;
    saldoAkhir: number;
  };
}

/**
 * Service untuk mengelola data MutasiStok
 */
export const mutasiStokService = {
  /**
   * Mendapatkan semua mutasi stok dengan pagination
   */
  getMutasiStoks: async (
    params?: GetMutasiStoksParams
  ): Promise<PaginatedResponse<MutasiStok>> => {
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

    const response = await axiosInstance.get<PaginatedResponse<MutasiStok>>(
      "/mutasi-stok",
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
   * Mendapatkan mutasi stok berdasarkan ID
   */
  getMutasiStokById: async (id: string): Promise<ApiResponse<MutasiStok>> => {
    const response = await axiosInstance.get<ApiResponse<MutasiStok>>(
      `/mutasi-stok/${id}`
    );
    return response.data;
  },

  /**
   * Mendapatkan mutasi stok berdasarkan produk ID
   */
  getMutasiStokByProduk: async (
    produkId: string,
    params?: Omit<GetMutasiStoksParams, "produkId">
  ): Promise<MutasiStokByProdukResponse> => {
    const { page, limit, dateFrom, dateTo, tipe, ...filterParams } =
      params || {};

    const response =
      await axiosInstance.get<MutasiStokByProdukResponse>(
        `/mutasi-stok/produk/${produkId}`,
        {
          params: {
            page: page || 1,
            limit: limit || 10,
            dateFrom,
            dateTo,
            tipe,
            ...filterParams,
          },
        }
      );
    return response.data;
  },

  /**
   * Membuat mutasi stok baru
   */
  createMutasiStok: async (
    data: CreateMutasiStokDto
  ): Promise<ApiResponse<MutasiStok>> => {
    const response = await axiosInstance.post<ApiResponse<MutasiStok>>(
      "/mutasi-stok",
      data
    );
    return response.data;
  },

  /**
   * Mengupdate mutasi stok
   */
  updateMutasiStok: async (
    data: UpdateMutasiStokDto
  ): Promise<ApiResponse<MutasiStok>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<MutasiStok>>(
      `/mutasi-stok/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Menghapus mutasi stok
   */
  deleteMutasiStok: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/mutasi-stok/${id}`
    );
    return response.data;
  },

  /**
   * Mendapatkan summary mutasi stok
   */
  getSummary: async (params?: Omit<GetMutasiStoksParams, "page" | "limit">) => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      "/mutasi-stok/summary",
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Mendapatkan produk dengan total stok (grouped by produk)
   */
  getProdukWithStok: async (
    params?: Omit<GetMutasiStoksParams, "page" | "limit">
  ): Promise<PaginatedResponse<ProdukWithStok>> => {
    const { page, limit, ...filterParams } = params || {};

    const response = await axiosInstance.get<PaginatedResponse<ProdukWithStok>>(
      "/mutasi-stok/produk-grouped",
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
};

