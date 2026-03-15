import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

export interface Pengupasan {
  id: string;
  invoice?: string | null;
  pekerjaId: string;
  produkJumlah: number;
  tanggal_mulai: string | Date;
  tanggal_selesai?: string | Date | null;
  upah_satuan: number;
  total_upah?: number | null;
  kemiri_campur_jumlah?: number | null;
  kemiri_cangkang_jumlah?: number | null;
  catatan?: string | null;
  status: "BERJALAN" | "SELESAI" | "DIBATALKAN" | "MENUNGGU_APPROVAL";
  pekerja?: {
    id: string;
    nama: string;
    telepon?: string;
    type: string;
  };
  createdBy?: {
    id: string;
    nama: string;
  } | null;
  confirmedBy?: {
    id: string;
    nama: string;
  } | null;
}

export interface CreatePengupasanDto {
  invoice?: string | null;
  pekerjaId: string;
  produkJumlah: number;
  tanggal_mulai?: string | Date;
  createdAt?: string;
  catatan?: string | null;
}

export interface ConfirmPengupasanDto {
  tanggal_selesai: string | Date;
  kemiriCampurMode: "otomatis" | "manual";
  kemiri_campur_jumlah_manual?: number | null;
  isCashless: boolean;
  rekeningId?: string | null;
  pembayaran: number;
  kemiri_campur_jumlah: number;
}

export interface UpdatePengupasanDto {
  id: string;
  pekerjaId?: string;
  upah_satuan?: number;
  total_upah?: number | null;
  catatan?: string | null;
}

export interface GetPengupasansParams {
  page?: number;
  limit?: number;
  search?: string;
  pekerjaId?: string;
  [key: string]: any;
}

export const pengupasanService = {
  getPengupasans: async (params?: any): Promise<PaginatedResponse<Pengupasan>> => {
    const response = await axiosInstance.get<PaginatedResponse<Pengupasan>>(
      "/pengupasan",
      { params }
    );
    return response.data;
  },
  getPengupasanById: async (id: string): Promise<ApiResponse<Pengupasan>> => {
    const response = await axiosInstance.get<ApiResponse<Pengupasan>>(
      `/pengupasan/${id}`
    );
    return response.data;
  },
  createPengupasan: async (data: CreatePengupasanDto): Promise<ApiResponse<Pengupasan>> => {
    const response = await axiosInstance.post<ApiResponse<Pengupasan>>(
      "/pengupasan",
      data
    );
    return response.data;
  },
  updatePengupasan: async (data: UpdatePengupasanDto): Promise<ApiResponse<Pengupasan>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<Pengupasan>>(
      `/pengupasan/${id}`,
      updateData
    );
    return response.data;
  },
  deletePengupasan: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/pengupasan/${id}`
    );
    return response.data;
  },
  confirmPengupasan: async (
    id: string,
    data: ConfirmPengupasanDto
  ): Promise<ApiResponse<Pengupasan>> => {
    const response = await axiosInstance.post<ApiResponse<Pengupasan>>(
      `/pengupasan/${id}/confirm`,
      data
    );
    return response.data;
  },
};
