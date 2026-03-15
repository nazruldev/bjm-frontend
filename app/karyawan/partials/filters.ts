import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Filter configuration untuk Karyawan table
 */
export const createKaryawanFilterConfigs = (): FilterConfig[] => [
  {
    type: "search",
    key: "nama",
    label: "Cari",
    placeholder: "Cari nama karyawan",
  },
];