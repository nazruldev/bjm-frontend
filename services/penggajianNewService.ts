import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

/**
 * Interface untuk data Penggajian
 */
export interface Penggajian {
  id: string;
  karyawanId: string;
  outletId: string;
  periodeBulan: number; // Bulan (1-12)
  periodeTahun: number; // Tahun (contoh: 2024, 2025)
  periodeStartDate?: string; // YYYY-MM-DD
  periodeEndDate?: string; // YYYY-MM-DD
  totalGaji: number;
  dibayar: number;
  status: "BELUM_LUNAS" | "PARTIAL" | "LUNAS";
  catatan?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  karyawan?: {
    id: string;
    nama: string;
    telepon?: string;
    gaji?: {
      id: string;
      nama: string;
      jumlah: number;
    };
  };
  pembayaran?: Array<{
    id: string;
    invoice: string;
    total: number;
    arus: "MASUK" | "KELUAR";
    isCashless: boolean;
    rekening?: {
      id: string;
      bank: string;
      nama: string;
    };
    createdAt: string | Date;
  }>;
  absensi?: Array<{
    id?: string;
    tanggal: string | Date;
    jam_masuk: string | Date;
    jam_keluar?: string | Date | null;
    total_jam?: number | null;
    status?: "HADIR" | "TIDAK_HADIR";
    catatan?: string | null;
  }>;
  totalJam?: number;
  jumlahAbsensi?: number;
  periodeDari?: string | Date;
  periodeSampai?: string | Date;
}

/**
 * Interface untuk grouped penggajian
 */
export interface GroupedPenggajian {
  karyawan: {
    id: string;
    nama: string;
    telepon?: string;
    gaji?: {
      id: string;
      nama: string;
      jumlah: number;
    };
  };
  penggajian: Penggajian[];
  totalGaji: number;
  totalDibayar: number;
  sisa: number;
  status: "BELUM_LUNAS" | "PARTIAL" | "LUNAS";
}

/**
 * Interface untuk query parameters
 */
export interface GetPenggajiansParams {
  page?: number;
  limit?: number;
  karyawanId?: string;
  status?: "BELUM_LUNAS" | "PARTIAL" | "LUNAS";
  periodeBulan?: number; // Bulan (1-12)
  periodeTahun?: number; // Tahun (contoh: 2024, 2025)
  [key: string]: any;
}

/**
 * Interface untuk generate penggajian
 * Mode periode: tanggal + periodeBulan + periodeTahun (akhir). Backend otomatis: mulai = tanggal yang sama di bulan sebelumnya. Contoh: 18 Jan 2025 → 18 Des 2024 s/d 18 Jan 2025
 * Mode manual: tanggalAwal + tanggalAkhir
 */
export interface GeneratePenggajianDto {
  tanggal?: number;
  periodeBulan?: number;
  periodeTahun?: number;
  tanggalAwal?: string;
  tanggalAkhir?: string;
  karyawanIds?: string[];
}

/**
 * Interface untuk batch payment
 */
export interface BatchPaymentDto {
  penggajianIds: string[];
  isCashless?: boolean;
  rekeningId?: string | null;
  catatan?: string | null;
}

/**
 * Interface untuk single payment
 */
export interface SinglePaymentDto {
  pembayaran: number;
  isCashless?: boolean;
  rekeningId?: string | null;
  catatan?: string | null;
}

/**
 * Service untuk mengelola data Penggajian
 */
export const penggajianNewService = {
  /**
   * Generate penggajian untuk periode tertentu
   */
  generatePenggajian: async (
    data: GeneratePenggajianDto
  ): Promise<ApiResponse<Penggajian[]>> => {
    const response = await axiosInstance.post<ApiResponse<Penggajian[]>>(
      "/penggajian-new/generate",
      data
    );
    return response.data;
  },

  /**
   * Mendapatkan semua penggajian dengan pagination
   */
  getPenggajians: async (
    params?: GetPenggajiansParams
  ): Promise<PaginatedResponse<Penggajian>> => {
    const { page, limit, ...filterParams } = params || {};
    
    const response = await axiosInstance.get<PaginatedResponse<Penggajian>>(
      "/penggajian-new",
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

  /**
   * Mendapatkan penggajian grouped by karyawan
   */
  getGroupedPenggajians: async (
    params?: { periodeBulan?: number; periodeTahun?: number }
  ): Promise<ApiResponse<GroupedPenggajian[]>> => {
    const response = await axiosInstance.get<ApiResponse<GroupedPenggajian[]>>(
      "/penggajian-new/grouped",
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Mendapatkan penggajian berdasarkan karyawan ID dengan pagination
   */
  getPenggajianByKaryawan: async (
    karyawanId: string,
    params?: {
      page?: number;
      limit?: number;
      periodeBulan?: number;
      periodeTahun?: number;
    }
  ): Promise<PaginatedResponse<Penggajian>> => {
    const { page, limit, ...filterParams } = params || {};
    const response = await axiosInstance.get<PaginatedResponse<Penggajian>>(
      `/penggajian-new/karyawan/${karyawanId}`,
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

  /**
   * Batch payment untuk multiple penggajian
   */
  batchPayment: async (
    data: BatchPaymentDto
  ): Promise<ApiResponse<{ pembayaran: any; penggajian: Penggajian[] }>> => {
    const response = await axiosInstance.post<ApiResponse<{ pembayaran: any; penggajian: Penggajian[] }>>(
      "/penggajian-new/batch-payment",
      data
    );
    return response.data;
  },

  /**
   * Single payment untuk satu penggajian
   */
  singlePayment: async (
    penggajianId: string,
    data: SinglePaymentDto
  ): Promise<ApiResponse<Penggajian>> => {
    const response = await axiosInstance.post<ApiResponse<Penggajian>>(
      `/penggajian-new/${penggajianId}/payment`,
      data
    );
    return response.data;
  },

  /**
   * Mendapatkan satu penggajian berdasarkan ID dengan detail absensi
   */
  getPenggajianById: async (
    id: string
  ): Promise<ApiResponse<Penggajian>> => {
    const response = await axiosInstance.get<ApiResponse<Penggajian>>(
      `/penggajian-new/${id}`
    );
    return response.data;
  },
};

