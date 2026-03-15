import axiosInstance, { ApiResponse } from "@/lib/axios";

export const SYSTEM_CONFIG_KEYS = [
  "KIRIMI_USER_CODE",
  "KIRIMI_DEVICE_ID",
  "KIRIMI_SECRET_KEY",
  "KIRIMI_ENABLED",
  "HIK_BASE_URL",
  "HIK_APP_KEY",
  "HIK_SECRET_KEY",
  "HIK_TOKEN",
] as const;

export type SystemConfigData = Record<string, string>;

export const systemConfigService = {
  getAll: async (): Promise<ApiResponse<SystemConfigData>> => {
    const res = await axiosInstance.get<ApiResponse<SystemConfigData>>("/system-config");
    return res.data;
  },

  updateBulk: async (data: SystemConfigData): Promise<ApiResponse<{ message: string }>> => {
    const res = await axiosInstance.put<ApiResponse<{ message: string }>>("/system-config", data);
    return res.data;
  },

  testKirimi: async (receiver: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await axiosInstance.post<ApiResponse<{ message: string }>>(
      "/system-config/test/kirimi",
      { receiver }
    );
    return res.data;
  },

  testHik: async (): Promise<ApiResponse<{ message: string }>> => {
    const res = await axiosInstance.post<ApiResponse<{ message: string }>>(
      "/system-config/test/hik"
    );
    return res.data;
  },
};
