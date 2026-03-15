import type { FilterConfig } from "@/components/datatables/filters";

const TYPE_OPTIONS = [
  { value: "", label: "Semua tipe" },
  { value: "HUTANG_BAYAR", label: "Pembayaran Hutang" },
  { value: "PIUTANG_BAYAR", label: "Penerimaan Piutang" },
  { value: "PEMBELIAN_BAYAR", label: "Pembayaran Pembelian" },
  { value: "KEUANGAN_CREATE", label: "Transaksi Keuangan" },
  { value: "PENGAJIAN_BAYAR", label: "Pembayaran Gaji" },
  { value: "PIUTANG_KONFIRMASI_BAYAR", label: "Konfirmasi Kasbon Cashless" },
  { value: "PENJEMURAN_BAYAR", label: "Pembayaran Penjemuran (Cashless)" },
  { value: "PENGUPASAN_BAYAR", label: "Pembayaran Pengupasan (Cashless)" },
];

export function createPendingApprovalFilterConfigs(): FilterConfig[] {
  return [
    {
      type: "select",
      key: "type",
      label: "Tipe",
      placeholder: "Semua tipe",
      options: TYPE_OPTIONS,
    },
    {
      type: "dateRange",
      key: "createdAt",
      label: "Tanggal",
      placeholder: "Pilih range tanggal",
    },
  ];
}
