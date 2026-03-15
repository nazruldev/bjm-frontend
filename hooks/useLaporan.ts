"use client";

import { useQuery } from "@tanstack/react-query";
import { laporanService, type LaporanParams } from "@/services/laporanService";

export const laporanKeys = {
  all: ["laporan"] as const,
  pengguna: (params?: LaporanParams) => [...laporanKeys.all, "pengguna", params] as const,
  pemasok: (params?: LaporanParams) => [...laporanKeys.all, "pemasok", params] as const,
  outlet: (params?: LaporanParams) => [...laporanKeys.all, "outlet", params] as const,
  karyawan: (params?: LaporanParams) => [...laporanKeys.all, "karyawan", params] as const,
  pekerja: (params?: LaporanParams) => [...laporanKeys.all, "pekerja", params] as const,
  gaji: (params?: LaporanParams) => [...laporanKeys.all, "gaji", params] as const,
  produk: (params?: LaporanParams) => [...laporanKeys.all, "produk", params] as const,
  mutasiStok: (params?: LaporanParams) => [...laporanKeys.all, "mutasi-stok", params] as const,
  penjemuran: (params?: LaporanParams) => [...laporanKeys.all, "penjemuran", params] as const,
  pengupasan: (params?: LaporanParams) => [...laporanKeys.all, "pengupasan", params] as const,
  pensortiran: (params?: LaporanParams) => [...laporanKeys.all, "pensortiran", params] as const,
  piutang: (params?: LaporanParams) => [...laporanKeys.all, "piutang", params] as const,
  hutang: (params?: LaporanParams) => [...laporanKeys.all, "hutang", params] as const,
  absensi: (params?: LaporanParams) => [...laporanKeys.all, "absensi", params] as const,
  penggajian: (params?: LaporanParams) => [...laporanKeys.all, "penggajian", params] as const,
  pembelian: (params?: LaporanParams) => [...laporanKeys.all, "pembelian", params] as const,
  penjualan: (params?: LaporanParams) => [...laporanKeys.all, "penjualan", params] as const,
  pembayaran: (params?: LaporanParams) => [...laporanKeys.all, "pembayaran", params] as const,
  keuangan: (params?: LaporanParams) => [...laporanKeys.all, "keuangan", params] as const,
  pendingApproval: (params?: LaporanParams) =>
    [...laporanKeys.all, "pending-approval", params] as const,
  rekening: (params?: LaporanParams) => [...laporanKeys.all, "rekening", params] as const,
  ringkasan: (params?: LaporanParams) => [...laporanKeys.all, "ringkasan", params] as const,
};

export function useLaporanPengguna(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.pengguna(params),
    queryFn: () => laporanService.getLaporanPengguna(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanPemasok(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.pemasok(params),
    queryFn: () => laporanService.getLaporanPemasok(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanOutlet(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.outlet(params),
    queryFn: () => laporanService.getLaporanOutlet(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanKaryawan(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.karyawan(params),
    queryFn: () => laporanService.getLaporanKaryawan(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanPekerja(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.pekerja(params),
    queryFn: () => laporanService.getLaporanPekerja(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanGaji(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.gaji(params),
    queryFn: () => laporanService.getLaporanGaji(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanProduk(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.produk(params),
    queryFn: () => laporanService.getLaporanProduk(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanMutasiStok(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.mutasiStok(params),
    queryFn: () => laporanService.getLaporanMutasiStok(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanPenjemuran(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.penjemuran(params),
    queryFn: () => laporanService.getLaporanPenjemuran(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanPengupasan(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.pengupasan(params),
    queryFn: () => laporanService.getLaporanPengupasan(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanPensortiran(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.pensortiran(params),
    queryFn: () => laporanService.getLaporanPensortiran(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanPiutang(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.piutang(params),
    queryFn: () => laporanService.getLaporanPiutang(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanHutang(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.hutang(params),
    queryFn: () => laporanService.getLaporanHutang(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanAbsensi(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.absensi(params),
    queryFn: () => laporanService.getLaporanAbsensi(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanPenggajian(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.penggajian(params),
    queryFn: () => laporanService.getLaporanPenggajian(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanPembelian(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.pembelian(params),
    queryFn: () => laporanService.getLaporanPembelian(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanPenjualan(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.penjualan(params),
    queryFn: () => laporanService.getLaporanPenjualan(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanPembayaran(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.pembayaran(params),
    queryFn: () => laporanService.getLaporanPembayaran(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanKeuangan(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.keuangan(params),
    queryFn: () => laporanService.getLaporanKeuangan(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanPendingApproval(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.pendingApproval(params),
    queryFn: () => laporanService.getLaporanPendingApproval(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanRekening(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.rekening(params),
    queryFn: () => laporanService.getLaporanRekening(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLaporanRingkasan(params?: LaporanParams) {
  return useQuery({
    queryKey: laporanKeys.ringkasan(params),
    queryFn: () => laporanService.getLaporanRingkasan(params),
    staleTime: 2 * 60 * 1000,
  });
}
