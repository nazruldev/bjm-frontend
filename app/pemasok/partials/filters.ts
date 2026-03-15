import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Filter configuration untuk Pemasok table
 */
export const createPemasokFilterConfigs = (): FilterConfig[] => [
  {
    type: "search",
    key: "search",
    label: "Cari",
    placeholder: "Cari nama, telepon, atau alamat pemasok",
  },
];
