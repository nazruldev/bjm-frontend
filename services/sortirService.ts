import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

export interface Sortir {
  id: string;
  code: string;
  produksiId: string;
  inspectorId: string;
  catatan?: string | null;
  inspector?: {
    id: string;
    nama: string;
    email?: string;
    role: string;
  };
  produksi?: {
    id: string;
    tipe_proses: string;
    status: string;
  };
}

export interface CreateSortirDto {
  code: string;
  inspectorId: string;
  tanggal_mulai?: string | Date;
  input: Array<{
    produkId: string;
    jumlah: number;
  }>;
  output: Array<{
    produkId: string;
    jumlah: number;
  }>;
  catatan?: string | null;
}

export interface UpdateSortirDto {
  id: string;
  code?: string;
  inspectorId?: string;
  catatan?: string | null;
}

export const sortirService = {
  getSortirs: async (params?: any): Promise<PaginatedResponse<Sortir>> => {
    const response = await axiosInstance.get<PaginatedResponse<Sortir>>(
      "/sortir",
      { params }
    );
    return response.data;
  },
  getSortirById: async (id: string): Promise<ApiResponse<Sortir>> => {
    const response = await axiosInstance.get<ApiResponse<Sortir>>(
      `/sortir/${id}`
    );
    return response.data;
  },
  createSortir: async (data: CreateSortirDto): Promise<ApiResponse<Sortir>> => {
    const response = await axiosInstance.post<ApiResponse<Sortir>>(
      "/sortir",
      data
    );
    return response.data;
  },
  updateSortir: async (data: UpdateSortirDto): Promise<ApiResponse<Sortir>> => {
    const { id, ...updateData } = data;
    const response = await axiosInstance.put<ApiResponse<Sortir>>(
      `/sortir/${id}`,
      updateData
    );
    return response.data;
  },
  deleteSortir: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/sortir/${id}`
    );
    return response.data;
  },
};

