import type { FilterConfig } from "@/components/datatables/filters";

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

      { value: "AKTIF", label: "Aktif" },
      { value: "PARTIAL", label: "Partial" },
      { value: "LUNAS", label: "Lunas" },
   
    ],
  },
 
  {
    type: "dateRange",
    key: "dateRange",
    label: "Rentang Tanggal",
    placeholder: "Pilih rentang tanggal",
  },

];

