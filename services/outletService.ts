import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk data Outlet (sesuai Prisma schema)
 */
export interface Outlet {
  id: string; // cuid
  nama: string;
  logo: string | null;
  alamat: string;
  telepon: string;
  defaultAccessLevelList?: string[];
  batasJamCheckinStart?: string;
  batasJamCheckinEnd?: string;
  batasJamCheckoutStart?: string;
  batasJamCheckoutEnd?: string;
  terkahirditutup?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

/**
 * Interface untuk create outlet
 */
export interface CreateOutletDto {
  nama: string;
  logo?: string | null;
  alamat: string;
  telepon: string;
  defaultAccessLevelList?: string[];
  batasJamCheckinStart: string;
  batasJamCheckinEnd: string;
  batasJamCheckoutStart: string;
  batasJamCheckoutEnd: string;
}

/**
 * Interface untuk update outlet
 */
export interface UpdateOutletDto extends Partial<CreateOutletDto> {
  id: string;
}

/**
 * Interface untuk query parameters dengan pagination dan filter
 */
export interface GetOutletsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // Filter params - sesuaikan dengan kebutuhan backend
  nama?: string;
  alamat?: string;
  telepon?: string;
  // Tambahkan filter lain sesuai kebutuhan
  [key: string]: any; // Untuk filter dinamis
}

/**
 * Service untuk mengelola data Outlet
 */
export const outletService = {
  /**
   * Mendapatkan semua outlet dengan pagination
   */
  getOutlets: async (
    params?: GetOutletsParams
  ): Promise<PaginatedResponse<Outlet>> => {
    // Extract filter params (exclude pagination params)
    const { page, limit, search, sortBy, sortOrder, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Outlet>>(
      "/outlets",
      {
        params: {
          page: page || 1,
          limit: limit || 10,
          search,
          sortBy,
          sortOrder,
          // Spread filter params
          ...filterParams,
        },
      }
    );
    return response.data;
  },

  /**
   * Mendapatkan outlet berdasarkan ID
   */
  getOutletById: async (id: string): Promise<ApiResponse<Outlet>> => {
    const response = await axiosInstance.get<ApiResponse<Outlet>>(
      `/outlets/${id}`
    );
    return response.data;
  },

  /**
   * Current outlet (based on token outletId, or X-Outlet-Id header for OWNER)
   */
  getCurrentOutlet: async (outletId?: string | null): Promise<ApiResponse<Outlet>> => {
    const response = await axiosInstance.get<ApiResponse<Outlet>>("/outlets/current", {
      headers: outletId ? { "X-Outlet-Id": outletId } : undefined,
    });
    return response.data;
  },

  /**
   * Membuat outlet baru
   */
  createOutlet: async (
    data: CreateOutletDto
  ): Promise<ApiResponse<Outlet>> => {
    const response = await axiosInstance.post<ApiResponse<Outlet>>(
      "/outlets",
      data
    );
    return response.data;
  },

  /**
   * Mengupdate outlet
   */
  updateOutlet: async (
    data: UpdateOutletDto
  ): Promise<ApiResponse<Outlet>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<Outlet>>(
      `/outlets/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Menghapus outlet permanen. Semua data terkait ikut terhapus (cascade).
   */
  deleteOutlet: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(
      `/outlets/${id}`
    );
    return response.data;
  },

  /**
   * Menghapus multiple outlet (batch delete)
   * Note: Backend tidak memiliki endpoint batch delete, jadi kita loop delete satu per satu
   */
  deleteOutlets: async (ids: string[]): Promise<ApiResponse<void>> => {
    // Loop delete satu per satu karena backend tidak support batch delete
    const results = await Promise.allSettled(
      ids.map((id) => outletService.deleteOutlet(id))
    );
    
    // Check jika ada yang gagal
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      throw new Error(`${failed.length} outlet gagal dihapus`);
    }
    
    return {
      success: true,
      message: `${ids.length} outlet berhasil dihapus`,
    } as ApiResponse<void>;
  },

  /**
   * Ambil ringkasan hari ini (teks saja, untuk preview dll)
   */
  getRingkasanHariIni: async (outletId?: string | null): Promise<{ text: string }> => {
    const response = await axiosInstance.get<{ text: string }>("/outlets/ringkasan-hari-ini", {
      headers: outletId ? { "X-Outlet-Id": outletId } : undefined,
    });
    return response.data;
  },

  /**
   * URL sumber gambar logo: data URL (base64), http(s), atau filename → URL API.
   */
  getOutletLogoSrc: (logo: string | null | undefined): string | null => {
    if (!logo || logo === "") return null;
    if (logo.startsWith("data:")) return logo;
    if (logo.startsWith("http://") || logo.startsWith("https://")) return logo;
    const base = axiosInstance.defaults.baseURL || "";
    return `${base}/outlets/logo/${encodeURIComponent(logo)}`;
  },

  /**
   * Kirim ringkasan hari ini ke WhatsApp owner via gateway Kirimi (tombol Tutup Toko).
   * Body: password (wajib), uangDiambil (optional). Jika uangDiambil > 0 dicatat ke Keuangan + Pembayaran.
   */
  kirimRingkasanWa: async (
    outletId: string | null | undefined,
    body: { password: string; uangDiambil?: number }
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>(
      "/outlets/kirim-ringkasan-wa",
      { password: body.password, uangDiambil: body.uangDiambil ?? 0 },
      { headers: outletId ? { "X-Outlet-Id": outletId } : undefined }
    );
    return response.data;
  },
};
