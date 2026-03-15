import axiosInstance, { ApiResponse } from "@/lib/axios";

/**
 * Interface untuk user data
 */
export interface User {
  id: string;
  email: string;
  name: string;
  nama?: string; // Backend mengembalikan 'nama', tapi kita juga support 'name' untuk kompatibilitas
  role: string;
  outletId?: string | null;
  outlet?: {
    id: string;
    nama: string;
    alamat?: string;
    telepon?: string;
    terkahirditutup?: string | Date | null;
  } | null;
  // Tambahkan field lain sesuai kebutuhan
}

/**
 * Interface untuk login request
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Interface untuk register request
 */
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  // Tambahkan field lain sesuai kebutuhan
}

/**
 * Interface untuk login/register response
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

/**
 * Service untuk authentication
 */
export const authService = {
  /**
   * Register user baru
   */
  register: async (data: RegisterDto): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        "/auth/register",
        data
      );
      
      // Simpan token setelah register berhasil
      if (response.data.data?.token) {
        localStorage.setItem("token", response.data.data.token);
        if (response.data.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.data.refreshToken);
        }
        // Simpan user role untuk digunakan di axios interceptor
        if (response.data.data?.user?.role) {
          localStorage.setItem("userRole", response.data.data.user.role);
        }
      }
      
      return response.data;
    } catch (error: any) {
      // Re-throw dengan format yang lebih jelas
      throw {
        message: error?.response?.data?.message || error?.message || "Registrasi gagal",
        errors: error?.response?.data?.errors,
        statusCode: error?.response?.status || 500,
      };
    }
  },

  /**
   * Login user
   */
  login: async (data: LoginDto): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        "/auth/login",
        data
      );
      
      // Simpan token setelah login berhasil
      if (response.data.data?.token) {
        localStorage.setItem("token", response.data.data.token);
        if (response.data.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.data.refreshToken);
        }
        // Simpan user role untuk digunakan di axios interceptor
        if (response.data.data?.user?.role) {
          localStorage.setItem("userRole", response.data.data.user.role);
        }
        // Simpan outletId untuk ADMIN/INSPECTOR/KASIR agar header X-Outlet-Id terkirim
        const outletId = response.data.data?.user?.outletId;
        if (outletId && typeof outletId === "string") {
          localStorage.setItem("userOutletId", outletId);
        }
      }
      
      return response.data;
    } catch (error: any) {
      // Re-throw dengan format yang lebih jelas
      throw {
        message: error?.response?.data?.message || error?.message || "Login gagal",
        errors: error?.response?.data?.errors,
        statusCode: error?.response?.status || 500,
      };
    }
  },

  /**
   * Get current user (me)
   */
  getMe: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await axiosInstance.get<ApiResponse<User>>("/auth/me");
      const data = response.data;
      // Sinkronkan userOutletId agar request berikutnya (e.g. pensortiran) kirim X-Outlet-Id
      if (typeof window !== "undefined" && data?.data?.outletId) {
        localStorage.setItem("userOutletId", data.data.outletId);
      }
      return data;
    } catch (error: any) {
      // Handle network error dengan lebih baik
      if (error?.statusCode === 0 || !error?.response) {
        // Network error - backend tidak bisa diakses
        console.error("[Auth Service] Network Error - Backend tidak dapat diakses", {
          baseURL: axiosInstance.defaults.baseURL,
          error: error?.message,
        });
        throw {
          message: "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.",
          errors: undefined,
          statusCode: 0,
        };
      }
      // Re-throw error lainnya
      throw {
        message: error?.response?.data?.message || error?.message || "Gagal mendapatkan data user",
        errors: error?.response?.data?.errors,
        statusCode: error?.response?.status || 500,
      };
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      // Panggil endpoint logout untuk hapus session di backend (untuk ADMIN/OWNER)
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        try {
          await axiosInstance.post("/auth/logout", {});
        } catch (error) {
          // Ignore error jika token sudah invalid atau network error
          console.error("[Logout API Error]", error);
        }
      }
    } catch (error) {
      // Ignore error
      console.error("[Logout Error]", error);
    } finally {
      // Clear local storage dan redirect
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("selectedOutletId");
      localStorage.removeItem("userOutletId");
      sessionStorage.removeItem("token");
      // Redirect ke login page jika diperlukan
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;
    return !!(
      localStorage.getItem("token") || sessionStorage.getItem("token")
    );
  },

  /**
   * Get stored token
   */
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  },
};

