import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Membuat filter configs untuk Pensortiran
 */
export const createPensortiranFilterConfigs = (
  inspectorOptions: { value: string; label: string }[] = []
): FilterConfig[] => [
  {
    type: "select",
    key: "inspectorId",
    label: "Inspector",
    placeholder: "Pilih inspector",
    options: inspectorOptions,
  },
  {
    type: "select",
    key: "status",
    label: "Status",
    placeholder: "Pilih status",
    options: [
      { value: "BERJALAN", label: "Berjalan" },
      { value: "SELESAI", label: "Selesai" },
      { value: "DIBATALKAN", label: "Dibatalkan" },
    ],
  },
  {
    type: "search",
    key: "search",
    label: "Cari Invoice",
    placeholder: "Cari invoice...",
    columnKey: "invoice",
  },
  {
    type: "dateRange",
    key: "tanggal",
    label: "Tanggal Mulai",
    placeholder: "Pilih range tanggal",
  },
];
