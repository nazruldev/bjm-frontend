"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  systemConfigService,
  type SystemConfigData,
} from "@/services/systemConfigService";

const KEY = ["system-config"] as const;

export function useSystemConfig(enabled = true) {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await systemConfigService.getAll();
      return res.data ?? {};
    },
    enabled,
  });
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SystemConfigData) => systemConfigService.updateBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast.success("Konfigurasi integrasi disimpan");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        "Gagal menyimpan";
      toast.error(msg);
    },
  });
}

export function useTestKirimi() {
  return useMutation({
    mutationFn: (receiver: string) => systemConfigService.testKirimi(receiver),
    onSuccess: (_, receiver) => {
      toast.success(`Pesan tes berhasil dikirim ke ${receiver}`);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        "Kirimi test gagal";
      toast.error(msg);
    },
  });
}

export function useTestHik() {
  return useMutation({
    mutationFn: () => systemConfigService.testHik(),
    onSuccess: () => {
      toast.success("Koneksi Hik berhasil");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        "Test Hik gagal";
      toast.error(msg);
    },
  });
}
