import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Membuat filter configs untuk Pembelian
 */
export const createPembelianFilterConfigs = (
  pemasokOptions: { value: string; label: string }[] = []
): FilterConfig[] => [
 

  {
    type: "select",
    key: "pemasokId",
    label: "Pemasok",
    placeholder: "Pilih pemasok",
    options: pemasokOptions,
  },

  {
    type: "dateRange",
    key: "createdAt",
    label: "Tanggal",
    placeholder: "Pilih range tanggal",
  },
  {
    type: "search",
    key: "search",
    label: "Cari Invoice",
    placeholder: "Cari berdasarkan invoice...",
  },
];



