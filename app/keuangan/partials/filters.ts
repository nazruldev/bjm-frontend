import type { FilterConfig } from "@/components/datatables/filters";

export const createKeuanganFilterConfigs = (): FilterConfig[] => [
  { type: "select", key: "arus", label: "Tipe", placeholder: "Semua", options: [{ value: "MASUK", label: "Masuk" }, { value: "KELUAR", label: "Keluar" }] },
  { type: "dateRange", key: "createdAt", label: "Tanggal", placeholder: "Pilih range tanggal" },
  { type: "search", key: "search", label: "Cari Invoice", placeholder: "Cari berdasarkan invoice..." },
];
