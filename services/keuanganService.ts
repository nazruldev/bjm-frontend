import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

export type ArusKas = "MASUK" | "KELUAR";

export type StatusPembayaranKeuangan = "LUNAS" | "MENUNGGU_APPROVAL" | "DITOLAK";

export interface Keuangan {
  id: string;
  invoice: string;
  outletId: string;
  arus?: ArusKas;
  total: number;
  statusPembayaran?: StatusPembayaranKeuangan;
  isCashless?: boolean;
  catatan?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
  createdBy?: { id: string; nama: string; email: string } | null;
}

export interface CreateKeuanganDto {
  invoice?: string;
  arus?: ArusKas;
  total: number;
  catatan?: string | null;
  isCashless?: boolean;
  rekeningId?: string | null;
  /** Tanggal transaksi (YYYY-MM-DD). Opsional; jika tidak diisi pakai default server. */
  createdAt?: string;
}

export interface UpdateKeuanganDto {
  arus?: ArusKas;
  total?: number;
  catatan?: string | null;
}

export interface GetKeuangansParams {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
  totalMin?: string;
  totalMax?: string;
  search?: string;
  arus?: ArusKas;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export const keuanganService = {
  getKeuangans: async (params?: GetKeuangansParams): Promise<PaginatedResponse<Keuangan>> => {
    const { page, limit, ...rest } = params || {};
    const q = new URLSearchParams();
    if (page) q.set("page", String(page));
    if (limit) q.set("limit", String(limit));
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
    });
    const res = await axiosInstance.get<PaginatedResponse<Keuangan>>(`/keuangan?${q}`);
    return res.data;
  },
  getKeuanganById: async (id: string): Promise<ApiResponse<Keuangan>> => {
    const res = await axiosInstance.get<ApiResponse<Keuangan>>(`/keuangan/${id}`);
    return res.data;
  },
  createKeuangan: async (data: CreateKeuanganDto): Promise<ApiResponse<Keuangan>> => {
    const res = await axiosInstance.post<ApiResponse<Keuangan>>("/keuangan", data);
    return res.data;
  },
  updateKeuangan: async (id: string, data: UpdateKeuanganDto): Promise<ApiResponse<Keuangan>> => {
    const res = await axiosInstance.put<ApiResponse<Keuangan>>(`/keuangan/${id}`, data);
    return res.data;
  },
  deleteKeuangan: async (id: string): Promise<ApiResponse<void>> => {
    const res = await axiosInstance.delete<ApiResponse<void>>(`/keuangan/${id}`);
    return res.data;
  },
};
