import type { FilterConfig } from "@/components/datatables/filters";

export const createPelangganFilterConfigs = (): FilterConfig[] => [
  {
    type: "search",
    key: "search",
    label: "Cari",
    placeholder: "Cari nama, telepon, atau alamat pelanggan",
  },
];
