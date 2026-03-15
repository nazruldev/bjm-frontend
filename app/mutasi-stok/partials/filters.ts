import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Membuat filter configs untuk MutasiStok
 */
export const createMutasiStokFilterConfigs = (
  produkOptions: { value: string; label: string }[] = []
): FilterConfig[] => [
  {
    type: "dateRange",
    key: "tanggal",
    label: "Tanggal",
    placeholder: "Pilih range tanggal",
  },
  {
    type: "select",
    key: "tipe",
    label: "Tipe Mutasi",
    placeholder: "Pilih tipe mutasi",
    options: [
      { value: "MASUK", label: "Masuk" },
      { value: "KELUAR", label: "Keluar" },
      { value: "SUSUT", label: "Susut" },
      { value: "HILANG", label: "Hilang" },
      { value: "RUSAK", label: "Rusak" },
    ],
  },
];

