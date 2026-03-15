import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Membuat filter configs untuk Penjemuran
 */
export const createPenjemuranFilterConfigs = (
  pekerjaOptions: { value: string; label: string }[] = []
): FilterConfig[] => [
  {
    type: "select",
    key: "pekerjaId",
    label: "Pekerja",
    placeholder: "Pilih pekerja",
    options: pekerjaOptions,
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

