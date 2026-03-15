import type { FilterConfig } from "@/components/datatables/filters";

/**
 * Filter configuration untuk Pembayaran table
 */
export const createPembayaranFilterConfigs = (): FilterConfig[] => [
  {
    type: "search",
    key: "search",
    label: "Cari Invoice",
    placeholder: "Cari invoice",
  },
  {
    type: "select",
    key: "sumberType",
    label: "Sumber",
    placeholder: "Pilih sumber",
    options: [
      { value: "PIUTANG", label: "Kasbon" },
      { value: "HUTANG", label: "Hutang" },
      { value: "PENGGAJIAN", label: "Penggajian" },
      { value: "PENGELUARAN", label: "Keuangan" },
      { value: "PEMBELIAN", label: "Pembelian" },
      { value: "PENJEMURAN", label: "Penjemuran" },
      { value: "PENJUALAN", label: "Penjualan" },
      { value: "PENGUPASAN", label: "Pengupasan" },
    ],
  },
  {
    type: "select",
    key: "arus",
    label: "Arus",
    placeholder: "Pilih arus",
    options: [
      { value: "MASUK", label: "Masuk" },
      { value: "KELUAR", label: "Keluar" },
    ],
  },
  {
    type: "dateRange",
    key: "dateRange",
    label: "Rentang Tanggal",
    placeholder: "Pilih rentang tanggal",
  },
];

