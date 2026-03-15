import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Filter configuration untuk Absensi table
 */
export const createAbsensiFilterConfigs = (karyawanOptions: { value: string; label: string }[]): FilterConfig[] => [
  {
    type: "select",
    key: "karyawanId",
    label: "Karyawan",
    placeholder: "Pilih karyawan",
    options: karyawanOptions,
  },
  {
    type: "dateRange",
    key: "tanggal",
    label: "Tanggal",
    placeholder: "Pilih rentang tanggal",
  },
];

