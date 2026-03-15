import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Filter configuration untuk Pengguna table
 */
export const createPenggunaFilterConfigs = (): FilterConfig[] => [
  {
    type: "search",
    key: "search",
    label: "Cari",
    placeholder: "Cari nama atau email",
  },
  {
    type: "select",
    key: "role",
    label: "Role",
    placeholder: "Pilih role",
    options: [
      { value: "ADMIN", label: "Admin" },
      { value: "KASIR", label: "Kasir" },
      { value: "INSPECTOR", label: "Inspector" },
    ],
  },
];