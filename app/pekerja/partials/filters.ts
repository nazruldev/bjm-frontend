import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Filter configuration untuk Pekerja table
 */
export const createPekerjaFilterConfigs = (): FilterConfig[] => [
  {
    type: "search",
    key: "nama",
    label: "Cari",
    placeholder: "Cari nama pekerja",
  },
  {
    type: "select",
    key: "type",
    label: "Tipe Pekerja",
    placeholder: "Pilih tipe",
    options: [
      { value: "PENJEMUR", label: "Penjemur" },
      { value: "PENGUPAS", label: "Pengupas" },
    ],
  },
];
