import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Filter configuration untuk Hutang invoice detail table
 */
export const createHutangInvoiceFilterConfigs = (): FilterConfig[] => [
  {
    type: "search",
    key: "search",
    label: "Cari Invoice",
    placeholder: "Cari invoice",
  },
  {
    type: "select",
    key: "status",
    label: "Status",
    placeholder: "Pilih status",
    options: [
      { value: "AKTIF", label: "Aktif" },
      { value: "PARTIAL", label: "Partial" },
      { value: "LUNAS", label: "Lunas" },
      { value: "DIBATALKAN", label: "Dibatalkan" },
    ],
  },
  {
    type: "dateRange",
    key: "dateRange",
    label: "Rentang Tanggal",
    placeholder: "Pilih rentang tanggal",
  },
];

