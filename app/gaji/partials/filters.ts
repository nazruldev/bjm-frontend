import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Filter configuration untuk Gaji table
 */
export const createGajiFilterConfigs = (): FilterConfig[] => [
  {
    type: "search",
    key: "nama",
    label: "Cari",
    placeholder: "Cari nama gaji",
  },
];

