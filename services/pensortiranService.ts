import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

export interface Pensortiran {
  id: string;
  invoice?: string | null;
  inspectorId?: string | null;
  produkJumlah: number;
  tanggal_mulai: string | Date;
  tanggal_selesai?: string | Date | null;
  jumlah_menir?: number | null;
  jumlah_abu?: number | null;
  jumlah_keping?: number | null;
  jumlah_bulat?: number | null;
  jumlah_busuk?: number | null;
  catatan?: string | null;
  status: "BERJALAN" | "SELESAI" | "DIBATALKAN";
  inspector?: {
    id: string;
    nama: string;
    email: string;
    role: string;
  };
}

export interface CreatePensortiranDto {
  invoice?: string | null;
  inspectorId?: string | null;
  produkJumlah: number;
  tanggal_mulai?: string | Date;
  catatan?: string | null;
}

export interface ConfirmPensortiranDto {
  tanggal_selesai: string | Date;
  jumlah_menir?: number | null;
  jumlah_abu?: number | null;
  jumlah_keping?: number | null;
  jumlah_bulat?: number | null;
  jumlah_busuk?: number | null;
  catatan?: string | null;
}

export interface UpdatePensortiranDto {
  id: string;
  inspectorId?: string;
  produkJumlah?: number;
  catatan?: string | null;
}

export interface GetPensortiransParams {
  page?: number;
  limit?: number;
  search?: string;
  inspectorId?: string;
  status?: string;
  [key: string]: any;
}

export const pensortiranService = {
  getPensortirans: async (params?: GetPensortiransParams): Promise<PaginatedResponse<Pensortiran>> => {
    const response = await axiosInstance.get<PaginatedResponse<Pensortiran>>(
      "/pensortiran",
      { params }
    );
    return response.data;
  },
  getPensortiranById: async (id: string): Promise<ApiResponse<Pensortiran>> => {
    const response = await axiosInstance.get<ApiResponse<Pensortiran>>(
      `/pensortiran/${id}`
    );
    return response.data;
  },
  createPensortiran: async (data: CreatePensortiranDto): Promise<ApiResponse<Pensortiran>> => {
    const response = await axiosInstance.post<ApiResponse<Pensortiran>>(
      "/pensortiran",
      data
    );
    return response.data;
  },
  deletePensortiran: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/pensortiran/${id}`
    );
    return response.data;
  },
  confirmPensortiran: async (
    id: string,
    data: ConfirmPensortiranDto
  ): Promise<ApiResponse<Pensortiran>> => {
    const response = await axiosInstance.post<ApiResponse<Pensortiran>>(
      `/pensortiran/${id}/confirm`,
      data
    );
    return response.data;
  },
};
