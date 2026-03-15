import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Filter configuration untuk Piutang grouped table
 */
export const createPiutangFilterConfigs = (): FilterConfig[] => [
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
];

/**
 * Filter configuration untuk Piutang invoice detail table
 */
export const createPiutangInvoiceFilterConfigs = (): FilterConfig[] => [
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
      { value: "PENDING", label: "Pending" },
      { value: "AKTIF", label: "Aktif" },
      { value: "PARTIAL", label: "Partial" },
      { value: "LUNAS", label: "Lunas" },
      { value: "DIBATALKAN", label: "Dibatalkan" },
    ],
  },
];

