import axiosInstance from "@/lib/axios";

export interface SyncAbsensiLogItem {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  success: boolean;
  errorMessage: string | null;
  devicesProcessed: number | null;
  eventsCount: number | null;
  groupsCount: number | null;
  createdCount: number | null;
  updatedCount: number | null;
}

export interface GetSyncAbsensiLogsParams {
  page?: number;
  limit?: number;
}

export interface GetSyncAbsensiLogsResponse {
  success: boolean;
  data: SyncAbsensiLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const syncAbsensiLogService = {
  getLogs: async (
    params?: GetSyncAbsensiLogsParams
  ): Promise<{ data: SyncAbsensiLogItem[]; pagination: GetSyncAbsensiLogsResponse["pagination"] }> => {
    const { page = 1, limit = 20 } = params ?? {};
    const response = await axiosInstance.get<GetSyncAbsensiLogsResponse>(
      "/hik/sync-absensi-logs",
      { params: { page, limit } }
    );
    const body = response.data;
    return {
      data: body?.data ?? [],
      pagination: body?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  },

  /** Trigger sync absensi manual (Hik → DB). Butuh auth. */
  syncNow: async (): Promise<{ success: boolean; message?: string; data?: { created?: number; updated?: number; eventsCount?: number; devicesProcessed?: number } }> => {
    const response = await axiosInstance.post<{ success: boolean; message?: string; data?: Record<string, number> }>(
      "/hik/sync-absensi",
      {}
    );
    return response.data;
  },
};
