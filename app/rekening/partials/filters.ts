import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Filter configuration untuk Rekening table
 */
export const createRekeningFilterConfigs = (): FilterConfig[] => [
  {
    type: "search",
    key: "nama",
    label: "Cari",
    placeholder: "Cari nama rekening",
  },
  {
    type: "select",
    key: "isActive",
    label: "Status",
    placeholder: "Pilih status",
    options: [
      { value: "true", label: "Aktif" },
      { value: "false", label: "Nonaktif" },
    ],
  },
];