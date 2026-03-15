import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

/**
 * Base URL untuk API
 * Bisa diubah sesuai dengan environment (development, staging, production)
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Interface untuk response API yang standar
 */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * Interface untuk paginated response
 */
export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
  success: boolean;
}

/**
 * Interface untuk error response
 */
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
  response?: any; // Full error response untuk debugging
}

/**
 * Membuat instance axios dengan konfigurasi default
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 detik
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor
 * Menambahkan token authentication dan logging
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Ambil token dari localStorage atau cookie
    const token = typeof window !== "undefined"
      ? localStorage.getItem("token") || sessionStorage.getItem("token")
      : null;

    // Tambahkan token ke header jika ada
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Header X-Outlet-Id: OWNER pakai selected outlet; ADMIN/INSPECTOR/KASIR pakai userOutletId
    if (typeof window !== "undefined" && config.headers) {
      const userRole = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
      const selectedOutletId = localStorage.getItem("selectedOutletId");
      const userOutletId = localStorage.getItem("userOutletId");

      if (userRole === "OWNER" && selectedOutletId) {
        config.headers["X-Outlet-Id"] = selectedOutletId;
      } else if ((userRole === "ADMIN" || userRole === "INSPECTOR" || userRole === "KASIR") && userOutletId) {
        config.headers["X-Outlet-Id"] = userOutletId;
      }
    }

    // Log request di development
    if (process.env.NODE_ENV === "development") {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
        headers: config.headers,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    // Handle request error
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handle response dan error secara global
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response di development
    if (process.env.NODE_ENV === "development") {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Handle error response
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle special case: jika responseType adalah blob tapi error terjadi
      // Kita perlu parse blob sebagai JSON untuk mendapatkan error message
      let errorData: any = data;
      if (data instanceof Blob && error.config?.responseType === "blob") {
        try {
          const text = await data.text();
          errorData = JSON.parse(text);
        } catch (e) {
          // Jika gagal parse, gunakan data asli
          console.error("[API Error] Failed to parse blob error response", e);
        }
      }

      // Handle 401 Unauthorized - redirect ke login
      // KECUALI untuk endpoint verify-password (401 = password salah, bukan session expired)
      const isVerifyPasswordEndpoint = error.config?.url?.includes("/auth/verify-password");

      if (status === 401 && !isVerifyPasswordEndpoint) {
        if (typeof window !== "undefined") {
          const errorMessage = errorData?.message || errorData?.error?.message || "";

          // OWNER tanpa outlet: jangan anggap session habis, jangan redirect ke login
          const isOutletRequired = /Outlet ID diperlukan|pilih outlet/i.test(errorMessage);
          if (isOutletRequired) {
            return Promise.reject({
              message: errorMessage,
              errors: errorData?.errors || errorData?.error,
              statusCode: status,
              response: errorData,
              outletRequired: true,
            } as ApiError & { outletRequired?: boolean });
          }

          // Cek apakah error message menunjukkan session tidak ditemukan (double login)
          const isSessionExpired = errorMessage.includes("Session tidak ditemukan") ||
            errorMessage.includes("login di tempat lain");

          // Clear semua storage
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userRole");
          localStorage.removeItem("selectedOutletId");
          localStorage.removeItem("userOutletId");

          // Redirect ke login page jika tidak sedang di halaman login/register
          if (!window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/register")) {
            if (isSessionExpired) {
              window.location.href = "/login?message=" + encodeURIComponent("Anda telah logout karena login di tempat lain. Silakan login kembali.");
            } else {
              window.location.href = "/login";
            }
          }
        }
      }

      // Handle 400 Bad Request - tampilkan pesan error yang jelas
      if (status === 400) {
        const errorMessage = errorData?.error?.message || errorData?.message || "Permintaan tidak valid";
        
        // Log error dengan aman (hindari circular reference)
        console.error(`[API Error] Bad Request (${status}): ${errorMessage}`);
        if (error.config?.url) {
          console.error(`[API Error] URL: ${error.config.method?.toUpperCase()} ${error.config.url}`);
        }
        
        return Promise.reject({
          message: errorMessage,
          errors: errorData?.errors || errorData?.error,
          statusCode: status,
          response: errorData, // Include full response untuk debugging
        } as ApiError);
      }

      // Handle 403 Forbidden
      if (status === 403) {
        console.error("[API Error] Access Forbidden", errorData?.message);
      }

      // Handle 404 Not Found
      // if (status === 404) {
      //   console.error("[API Error] Resource Not Found", errorData?.message);
      // }

      // Handle 500 Internal Server Error
      if (status >= 500) {
        const errorMessage = errorData?.message || "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
        console.error("[API Error] Server Error", {
          status,
          message: errorMessage,
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          response: errorData,
        });
        return Promise.reject({
          message: errorMessage,
          errors: errorData?.errors,
          statusCode: status,
        } as ApiError);
      }

      // Return error dengan format yang konsisten
      return Promise.reject({
        message: errorData?.error?.message || errorData?.message || error.message || "Terjadi kesalahan pada server",
        errors: errorData?.errors || errorData?.error,
        statusCode: status,
        response: errorData, // Include full response untuk debugging
      } as ApiError);
    }

    // Handle network error
    if (error.request) {
      const baseURL = error.config?.baseURL || BASE_URL || "unknown";
      const url = error.config?.url || "";
      const method = error.config?.method || "";
      const errorCode = error.code || "";
      const errorMessage = error.message || "";

      // Build log message dengan string template untuk menghindari object kosong
      const logParts: string[] = [];
      if (errorMessage) logParts.push(`Message: ${errorMessage}`);
      if (url) logParts.push(`URL: ${url}`);
      if (baseURL && baseURL !== "unknown") logParts.push(`BaseURL: ${baseURL}`);
      if (method) logParts.push(`Method: ${method.toUpperCase()}`);
      if (errorCode) logParts.push(`Code: ${errorCode}`);

      if (logParts.length > 0) {
        console.error("[API Error] Network Error -", logParts.join(" | "));
      } else {
        console.error("[API Error] Network Error - Backend tidak dapat diakses");
      }
      console.info(
        "[API Error] Solusi: jalankan backend dulu. Dari root project: bun run dev (atau cd be && bun run dev)"
      );

      return Promise.reject({
        message: `Tidak dapat terhubung ke server${baseURL && baseURL !== "unknown" ? ` (${baseURL})` : ""}. Jalankan backend: dari root gunakan \`bun run dev\`, atau di folder be jalankan \`bun run dev\`.`,
        statusCode: 0,
      } as ApiError);
    }

    // Handle error lainnya
    console.error("[API Error] Unknown Error", error.message);
    return Promise.reject({
      message: error.message || "Terjadi kesalahan yang tidak diketahui",
      statusCode: 0,
    } as ApiError);
  }
);

export default axiosInstance;

