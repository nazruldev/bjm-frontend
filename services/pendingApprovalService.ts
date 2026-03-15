import axiosInstance, { ApiResponse, PaginatedResponse } from "@/lib/axios";

export interface PendingApprovalItem {
  id: string;
  type: string;
  outletId: string;
  approvalCode: string;
  payload: Record<string, unknown> & { title?: string; summary?: string };
  createdById: string | null;
  createdAt: string;
  outlet?: { id: string; nama: string };
  createdBy?: { id: string; nama: string } | null;
  /** Dari backend: label sumber transaksi (dari mana pembayaran cashless) */
  sumberLabel?: string;
  /** Dari backend: ringkasan untuk tampilan (tidak kosong) */
  displaySummary?: string;
}

export interface GetPendingApprovalsParams {
  page?: number;
  limit?: number;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const pendingApprovalService = {
  getList: async (
    params?: GetPendingApprovalsParams
  ): Promise<PaginatedResponse<PendingApprovalItem>> => {
    const q = new URLSearchParams();
    if (params?.page != null) q.set("page", String(params.page));
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.type) q.set("type", params.type);
    if (params?.dateFrom) q.set("dateFrom", params.dateFrom);
    if (params?.dateTo) q.set("dateTo", params.dateTo);
    const response = await axiosInstance.get<PaginatedResponse<PendingApprovalItem>>(
      `/pending-approval?${q.toString()}`
    );
    return response.data;
  },

  resend: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
      `/pending-approval/${id}/resend`
    );
    return response.data;
  },
};
