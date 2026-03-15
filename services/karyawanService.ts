import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk relasi Gaji
 */
export interface GajiRelation {
  id: string;
  nama: string;
  jumlah: number;
}

/**
 * Interface untuk data Karyawan (sesuai Prisma schema)
 */
export interface Karyawan {
  id: string;
  outletId: string;
  nama: string;
  telepon: string | null;
  alamat: string | null;
  personId?: string | null;
  groupId?: string | null;
  gender?: number | null;
  email?: string | null;
  headPicUrl?: string | null;
  faceBase64?: string | null;
  pinCode?: string | null;
  accessLevelList?: string[] | null;
  isRegisteredBiometric?: boolean;
  gajiId?: string | null;
  gaji?: GajiRelation | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

/**
 * Interface untuk create karyawan
 */
export interface CreateKaryawanDto {
  nama: string;
  telepon?: string | null;
  alamat?: string | null;
  gajiId?: string | null;
  personId?: string | null;
  groupId?: string | null;
  gender?: number | null;
  email?: string | null;
  headPicUrl?: string | null;
  faceBase64?: string | null;
}

/**
 * Interface untuk update karyawan
 */
export interface UpdateKaryawanDto extends Partial<CreateKaryawanDto> {
  id: string;
}

/**
 * Interface untuk query parameters dengan pagination dan filter
 */
export interface GetKaryawansParams {
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
 * Service untuk mengelola data Karyawan
 */
export const karyawanService = {
  /**
   * Mendapatkan semua karyawan dengan pagination
   */
  getKaryawans: async (
    params?: GetKaryawansParams
  ): Promise<PaginatedResponse<Karyawan>> => {
    const { page, limit, search, sortBy, sortOrder, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Karyawan>>(
      "/karyawan",
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
   * Mendapatkan karyawan berdasarkan ID
   */
  getKaryawanById: async (id: string): Promise<ApiResponse<Karyawan>> => {
    const response = await axiosInstance.get<ApiResponse<Karyawan>>(
      `/karyawan/${id}`
    );
    return response.data;
  },

  /**
   * Membuat karyawan baru
   */
  createKaryawan: async (
    data: CreateKaryawanDto
  ): Promise<ApiResponse<Karyawan>> => {
    const response = await axiosInstance.post<ApiResponse<Karyawan>>(
      "/karyawan",
      data
    );
    return response.data;
  },

  /**
   * Aktifkan biometric: daftarkan karyawan ke device Hik (personId, personCode, PIN), isi access level default outlet.
   * Hanya untuk karyawan yang belum punya personId.
   */
  aktifkanBiometric: async (id: string): Promise<ApiResponse<Karyawan>> => {
    const response = await axiosInstance.post<ApiResponse<Karyawan>>(
      `/karyawan/${id}/aktifkan-biometric`
    );
    return response.data;
  },

  /**
   * Upload foto karyawan ke Hik, simpan headPicUrl ke backend.
   * photoData = base64 string (tanpa prefix data:image/...).
   */
  uploadKaryawanPhoto: async (
    id: string,
    photoData: string
  ): Promise<ApiResponse<Karyawan>> => {
    const response = await axiosInstance.post<ApiResponse<Karyawan>>(
      `/karyawan/${id}/photo`,
      { photoData }
    );
    return response.data;
  },

  /**
   * Mengupdate karyawan
   */
  updateKaryawan: async (
    data: UpdateKaryawanDto
  ): Promise<ApiResponse<Karyawan>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<Karyawan>>(
      `/karyawan/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Menghapus karyawan
   */
  deleteKaryawan: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/karyawan/${id}`
    );
    return response.data;
  },

  /**
   * Pindah karyawan ke outlet lain. Hanya OWNER.
   */
  pindahOutlet: async (
    id: string,
    outletId: string
  ): Promise<ApiResponse<Karyawan>> => {
    const response = await axiosInstance.post<ApiResponse<Karyawan>>(
      `/karyawan/${id}/pindah-outlet`,
      { outletId }
    );
    return response.data;
  },

  /**
   * Menghapus multiple karyawan (batch delete)
   */
  deleteKaryawans: async (ids: string[]): Promise<ApiResponse<void>> => {
    const results = await Promise.allSettled(
      ids.map((id) => karyawanService.deleteKaryawan(id))
    );
    
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      throw new Error(`${failed.length} karyawan gagal dihapus`);
    }
    
    return {
      success: true,
      message: `${ids.length} karyawan berhasil dihapus`,
    } as ApiResponse<void>;
  },

  /**
   * Daftar access level dari Hik (untuk atur device mana yang bisa di-scan karyawan).
   */
  getAccessLevelList: async (): Promise<{
    success: boolean;
    data?: { data?: { accessLevelResponse?: { accessLevelList?: { id: string; name: string }[] } } };
  }> => {
    const response = await axiosInstance.post<{ success: boolean; data?: any }>(
      "/hik/access-levels/list",
      { accessLevelSearchRequest: { pageIndex: 1, pageSize: 100, searchCriteria: {} } }
    );
    return response.data;
  },

  /**
   * Tambah access level ke karyawan (person bisa scan di device sesuai level).
   */
  addKaryawanAccessLevel: async (
    karyawanId: string,
    accessLevelIdList: string[]
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await axiosInstance.post<{ success: boolean; message?: string }>(
      `/karyawan/${karyawanId}/access-levels`,
      { accessLevelIdList }
    );
    return response.data;
  },

  /**
   * Ganti PIN karyawan (update di Hik lalu simpan ke backend).
   */
  updateKaryawanPin: async (
    karyawanId: string,
    pinCode: string
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await axiosInstance.patch<{ success: boolean; message?: string }>(
      `/karyawan/${karyawanId}/pin`,
      { pinCode }
    );
    return response.data;
  },

  /**
   * Set random PIN 6 digit untuk semua karyawan di outlet saat ini. Hanya OWNER.
   */
  setRandomPinAll: async (): Promise<{
    success: boolean;
    message?: string;
    data?: {
      updated: number;
      failed: { id: string; nama: string; reason: string }[];
      updatedList?: { nama: string; pinCode: string }[];
    };
  }> => {
    const response = await axiosInstance.post<{
      success: boolean;
      message?: string;
      data?: {
        updated: number;
        failed: { id: string; nama: string; reason: string }[];
        updatedList?: { nama: string; pinCode: string }[];
      };
    }>("/karyawan/actions/set-random-pin-all");
    return response.data;
  },

  /**
   * Export daftar nama + PIN semua karyawan di outlet (untuk kirim ke WhatsApp).
   */
  exportNamaPin: async (): Promise<{ list: { nama: string; pinCode: string }[] }> => {
    const response = await axiosInstance.post<{ list: { nama: string; pinCode: string }[] }>(
      "/karyawan/actions/export-nama-pin"
    );
    return response.data;
  },

  /**
   * Buat link form mandiri (self-service) untuk karyawan: upload foto & ganti PIN.
   * Link berlaku 7 hari. Kirim ke karyawan agar bisa isi sendiri.
   */
  generateSelfServiceLink: async (
    karyawanId: string
  ): Promise<ApiResponse<{ url: string }>> => {
    const response = await axiosInstance.post<ApiResponse<{ url: string }>>(
      `/karyawan/${karyawanId}/self-service-link`
    );
    return response.data;
  },

  /**
   * Kirim link form mandiri ke nomor WhatsApp via gateway KiRIMI.
   * Timeout 60s karena KiRIMI bisa lambat; hindari network error di FE.
   */
  sendMandiriLinkWa: async (
    receiver: string,
    url: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
      "/karyawan/send-mandiri-link-wa",
      { receiver, url },
      { timeout: 60000 }
    );
    return response.data;
  },

  /**
   * Mendapatkan karyawan yang belum ter-assign ke gaji
   */
  getKaryawansWithoutGaji: async (
    params?: Omit<GetKaryawansParams, "page" | "limit">
  ): Promise<PaginatedResponse<Karyawan>> => {
    const { search, sortBy, sortOrder, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Karyawan>>(
      "/karyawan/without-gaji",
      {
        params: {
          limit: 1000, // Get all available
          search,
          sortBy,
          sortOrder,
          ...filterParams,
        },
      }
    );
    return response.data;
  },
};