"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  authService,
  type LoginDto,
  type RegisterDto,
  type User,
} from "@/services/authService";

/**
 * Query keys untuk auth
 */
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

/**
 * Hook untuk mendapatkan current user
 */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authService.getMe(),
    enabled: authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 menit
    gcTime: 10 * 60 * 1000, // 10 menit
    retry: (failureCount, error: any) => {
      // Jangan retry jika 401 (unauthorized)
      if (error?.statusCode === 401) {
        return false;
      }
      // Retry maksimal 2 kali untuk network error
      if (error?.statusCode === 0 && failureCount < 2) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Hook untuk login
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginDto) => authService.login(data),
    onSuccess: (response) => {
      // Simpan user role ke localStorage (jika belum disimpan di authService)
      if (response.data?.user?.role && typeof window !== "undefined") {
        localStorage.setItem("userRole", response.data.user.role);
      }
      // Invalidate dan refetch user data
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      toast.success(response.message || "Login berhasil");
      // Redirect ke dashboard atau home
      router.push("/");
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.message || 
        error?.response?.data?.message || 
        "Login gagal. Periksa email dan password Anda.";
      toast.error(errorMessage);
      console.error("[Login Error]", error);
    },
  });
}

/**
 * Hook untuk register
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterDto) => authService.register(data),
    onSuccess: (response) => {
      // Simpan user role ke localStorage (jika belum disimpan di authService)
      if (response.data?.user?.role && typeof window !== "undefined") {
        localStorage.setItem("userRole", response.data.user.role);
      }
      // Invalidate dan refetch user data
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      toast.success(response.message || "Registrasi berhasil");
      // Redirect ke dashboard atau home
      router.push("/");
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.message || 
        error?.response?.data?.message || 
        "Registrasi gagal. Silakan coba lagi.";
      toast.error(errorMessage);
      console.error("[Register Error]", error);
    },
  });
}

/**
 * Hook untuk logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return {
    logout: async () => {
      await authService.logout();
      queryClient.clear(); // Clear semua query cache
      queryClient.removeQueries(); // Remove semua queries
      router.push("/login");
    },
  };
}

/**
 * Hook untuk check authentication status
 */
export function useAuth() {
  const { data, isLoading, error } = useMe();
  const { logout } = useLogout();
  const router = useRouter();

  // Simpan user role ke localStorage saat user data berhasil di-fetch
  if (data?.data?.role && typeof window !== "undefined") {
    const currentRole = localStorage.getItem("userRole");
    if (currentRole !== data.data.role) {
      localStorage.setItem("userRole", data.data.role);
    }
  }

  // Jika network error (statusCode 0), jangan anggap sebagai unauthenticated
  // karena mungkin backend tidak running, tapi user masih punya token
  const isNetworkError = error && (error as any)?.statusCode === 0;
  const isAuthenticated = !!data?.data && (!error || isNetworkError);

  return {
    user: data?.data,
    isLoading,
    isAuthenticated,
    logout,
    error: isNetworkError ? null : error, // Hide network error dari consumer
  };
}

