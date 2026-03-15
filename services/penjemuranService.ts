import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

export interface Penjemuran {
  id: string;
  invoice?: string | null;
  pekerjaId: string;
  produkJumlah: number;
  tanggal_mulai: string | Date;
  tanggal_selesai?: string | Date | null;
  upah_satuan: number;
  total_upah?: number | null;
  susut_percentage?: number | null;
  susut_jumlah?: number | null;
  catatan?: string | null;
  status: "BERJALAN" | "SELESAI" | "DIBATALKAN" | "MENUNGGU_APPROVAL";
  pekerja?: {
    id: string;
    nama: string;
    telepon?: string;
    type: string;
  };
}

export interface CreatePenjemuranDto {
  invoice?: string | null;
  pekerjaId: string;
  produkJumlah: number;
  tanggal_mulai?: string | Date;
  createdAt?: string;
  upah_satuan?: number;
  catatan?: string | null;
}

export interface ConfirmPenjemuranDto {
  tanggal_selesai: string | Date;
  susutMode: "otomatis" | "manual";
  susut_jumlah_manual?: number | null;
  isCashless: boolean;
  rekeningId?: string | null;
  pembayaran: number;
  outputJumlah: number;
}

export interface UpdatePenjemuranDto {
  id: string;
  pekerjaId?: string;
  upah_satuan?: number;
  total_upah?: number | null;
  susut_percentage?: number | null;
  susut_jumlah?: number | null;
  catatan?: string | null;
}

export interface GetPenjemuransParams {
  page?: number;
  limit?: number;
  search?: string;
  pekerjaId?: string;
  [key: string]: any;
}

export const penjemuranService = {
  getPenjemurans: async (params?: any): Promise<PaginatedResponse<Penjemuran>> => {
    const response = await axiosInstance.get<PaginatedResponse<Penjemuran>>(
      "/penjemuran",
      { params }
    );
    return response.data;
  },
  getPenjemuranById: async (id: string): Promise<ApiResponse<Penjemuran>> => {
    const response = await axiosInstance.get<ApiResponse<Penjemuran>>(
      `/penjemuran/${id}`
    );
    return response.data;
  },
  createPenjemuran: async (data: CreatePenjemuranDto): Promise<ApiResponse<Penjemuran>> => {
    const response = await axiosInstance.post<ApiResponse<Penjemuran>>(
      "/penjemuran",
      data
    );
    return response.data;
  },
  updatePenjemuran: async (data: UpdatePenjemuranDto): Promise<ApiResponse<Penjemuran>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<Penjemuran>>(
      `/penjemuran/${id}`,
      updateData
    );
    return response.data;
  },
  deletePenjemuran: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/penjemuran/${id}`
    );
    return response.data;
  },
  confirmPenjemuran: async (
    id: string,
    data: ConfirmPenjemuranDto
  ): Promise<ApiResponse<Penjemuran>> => {
    const response = await axiosInstance.post<ApiResponse<Penjemuran>>(
      `/penjemuran/${id}/confirm`,
      data
    );
    return response.data;
  },
};

