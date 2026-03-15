import axiosInstance, {
  ApiResponse,
  PaginatedResponse,
} from "@/lib/axios";

export interface TarifPekerjaItem {
  id: string;
  nama: string | null;
  tipe: "PENJEMUR" | "PENGUPAS";
  tarifPerKg: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTarifPekerjaDto {
  nama?: string | null;
  tipe: "PENJEMUR" | "PENGUPAS";
  tarifPerKg: number;
}

export interface UpdateTarifPekerjaDto extends Partial<CreateTarifPekerjaDto> {
  id: string;
}

export interface GetTarifPekerjaParams {
  page?: number;
  limit?: number;
  tipe?: "PENJEMUR" | "PENGUPAS";
  search?: string;
  nama?: string;
}

export const tarifPekerjaService = {
  getAll: async (
    params?: GetTarifPekerjaParams
  ): Promise<PaginatedResponse<TarifPekerjaItem>> => {
    const response = await axiosInstance.get<
      PaginatedResponse<TarifPekerjaItem>
    >("/tarif-pekerja", {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        tipe: params?.tipe,
        search: params?.search ?? params?.nama,
      },
    });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<TarifPekerjaItem>> => {
    const response = await axiosInstance.get<ApiResponse<TarifPekerjaItem>>(
      `/tarif-pekerja/${id}`
    );
    return response.data;
  },

  create: async (
    data: Omit<CreateTarifPekerjaDto, "id">
  ): Promise<ApiResponse<TarifPekerjaItem> & { message?: string }> => {
    const response = await axiosInstance.post<
      ApiResponse<TarifPekerjaItem> & { message?: string }
    >("/tarif-pekerja", data);
    return response.data;
  },

  update: async (
    data: UpdateTarifPekerjaDto
  ): Promise<ApiResponse<TarifPekerjaItem> & { message?: string }> => {
    const { id, ...body } = data;
    const response = await axiosInstance.put<
      ApiResponse<TarifPekerjaItem> & { message?: string }
    >(`/tarif-pekerja/${id}`, body);
    return response.data;
  },

  delete: async (id: string): Promise<{ message?: string }> => {
    const response = await axiosInstance.delete<{ message?: string }>(
      `/tarif-pekerja/${id}`
    );
    return response.data;
  },
};
