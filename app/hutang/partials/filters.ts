import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Filter configuration untuk Hutang grouped table
 */
export const createHutangFilterConfigs = (): FilterConfig[] => [
  {
    type: "search",
    key: "search",
    label: "Cari Subject",
    placeholder: "Cari subject",
  },
  {
    type: "select",
    key: "subjekType",
    label: "Tipe Subjek",
    placeholder: "Pilih tipe subjek",
    options: [
      { value: "KARYAWAN", label: "Karyawan" },
      { value: "PEKERJA", label: "Pekerja" },
      { value: "PEMASOK", label: "Pemasok" },
    ],
  },
  {
    type: "select",
    key: "status",
    label: "Status",
    placeholder: "Pilih status",
    options: [
      { value: "AKTIF,PARTIAL", label: "Aktif & Partial" },
      { value: "AKTIF", label: "Aktif" },
      { value: "PARTIAL", label: "Partial" },
      { value: "LUNAS", label: "Lunas" },
      { value: "AKTIF,PARTIAL,LUNAS", label: "Semua (kecuali Dibatalkan)" },
    ],
  },
];

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

