import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Filter configuration untuk Tarif Pekerja table
 */
export const createTarifPekerjaFilterConfigs = (): FilterConfig[] => [
  {
    type: "select",
    key: "tipe",
    label: "Tipe",
    placeholder: "Semua tipe",
    options: [
      { value: "PENJEMUR", label: "Penjemur" },
      { value: "PENGUPAS", label: "Pengupas" },
    ],
  },
  {
    type: "search",
    key: "nama",
    label: "Cari",
    placeholder: "Cari nama / label",
  },
];
