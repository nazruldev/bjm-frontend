import axiosInstance from "@/lib/axios";

export interface DeviceAcsItem {
  id?: string;
  deviceId?: string;
  code?: string;
  name?: string;
  category?: string;
  type?: string;
  serialNo?: string;
  version?: string;
  timeZone?: string;
  onlineStatus?: number;
  addTime?: string;
  areaId?: string;
  accessLevelList?: unknown[];
  [key: string]: unknown;
}

export interface GetDevicesResponse {
  success: boolean;
  devices?: DeviceAcsItem[];
  data?: unknown;
  receivedFromHik?: number;
  created?: number;
  message?: string;
}

export interface GetDeviceDetailResponse {
  success: boolean;
  data?: unknown;
  devices?: DeviceAcsItem[];
  synced?: number;
  message?: string;
}

export const deviceAcsService = {
  /**
   * Get list devices dari Hik (sync ke DB). GET atau POST dengan query/body pageIndex, pageSize, filter.
   */
  getDevices: async (params?: {
    pageIndex?: number;
    pageSize?: number;
    filter?: Record<string, unknown>;
  }): Promise<GetDevicesResponse> => {
    const { pageIndex = 1, pageSize = 20, filter = {} } = params ?? {};
    const response = await axiosInstance.post<GetDevicesResponse>("/hik/devices", {
      pageIndex,
      pageSize,
      filter,
    });
    return response.data;
  },

  /**
   * Get detail device dari Hik. Body: { deviceID: string[], deviceSerialNo?: string }.
   */
  getDeviceDetail: async (
    deviceID: string[],
    deviceSerialNo?: string
  ): Promise<GetDeviceDetailResponse> => {
    const body: { deviceID: string[]; deviceSerialNo?: string } = { deviceID };
    if (deviceSerialNo != null) body.deviceSerialNo = deviceSerialNo;
    const response = await axiosInstance.post<GetDeviceDetailResponse>(
      "/hik/devices/detail",
      body
    );
    return response.data;
  },

  /**
   * Step 1: Dapatkan stream token dari Hik (GET /api/hccgw/platform/v1/streamtoken/get).
   */
  getStreamToken: async (): Promise<{ success: boolean; data?: { appToken: string; streamAreaDomain: string; expireTime?: string | null }; message?: string }> => {
    const response = await axiosInstance.get<{ success: boolean; data?: { appToken: string; streamAreaDomain: string; expireTime?: string | null }; message?: string }>(
      "/hik/stream-token"
    );
    return response.data;
  },

  /**
   * Step 2: Dapatkan URL live stream (m3u8). Bisa kirim appToken + streamAreaDomain dari step 1.
   */
  getLiveStreamUrl: async (
    deviceSerial: string,
    token?: { appToken: string; streamAreaDomain: string }
  ): Promise<{ success: boolean; data?: { url: string; expireTime?: string | null }; message?: string }> => {
    const body: { deviceSerial: string; appToken?: string; streamAreaDomain?: string } = { deviceSerial };
    if (token?.appToken) body.appToken = token.appToken;
    if (token?.streamAreaDomain) body.streamAreaDomain = token.streamAreaDomain;
    const response = await axiosInstance.post<{ success: boolean; data?: { url: string; expireTime?: string | null }; message?: string }>(
      "/hik/live-stream-url",
      body
    );
    return response.data;
  },
};
