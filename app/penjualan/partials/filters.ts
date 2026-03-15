import type { FilterConfig } from "@/components/datatables/filters";

export const createPenjualanFilterConfigs = (): FilterConfig[] => [
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
