import type { FilterConfig } from "@/components/datatables/filters";

const STATUS_OPTIONS = [
  { value: "MENUNGGU", label: "Menunggu" },
  { value: "DALAM_PENGIRIMAN", label: "Dalam Pengiriman" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DIBATALKAN", label: "Dibatalkan" },
];

export const createPengirimanFilterConfigs = (): FilterConfig[] => [
  {
    type: "search",
    key: "search",
    label: "Cari",
    placeholder: "Cari nomor invoice penjualan...",
  },
  {
    type: "select",
    key: "status",
    label: "Status",
    options: STATUS_OPTIONS,
  },
];
