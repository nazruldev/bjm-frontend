import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, FileText, Eye, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Penjualan } from "@/services/penjualanService";
import dayjs from "@/lib/dayjs";
import { Badge } from "@/components/ui/badge";

const statusPengirimanStyle: Record<string, string> = {
  MENUNGGU: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
  DALAM_PENGIRIMAN: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
  SELESAI: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
  DIBATALKAN: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

/** canDelete: hanya OWNER yang boleh hapus; false sembunyikan aksi Hapus. */
export const createPenjualanColumns = (
  onViewDetail: (id: string) => void,
  onDeleteClick: (id: string, invoice: string) => void,
  canDelete: boolean = true,
  onAddPengiriman?: (penjualanId: string) => void
): ColumnDef<Penjualan>[] => [
  {
    accessorKey: "invoice",
    header: "Invoice",
    cell: ({ row }) => (
      <div
        onClick={() => onViewDetail(row.original.id)}
        className="flex items-center gap-2 cursor-pointer hover:text-primary"
      >
        <FileText className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.original.invoice}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "detail",
    header: "Item",
    cell: ({ row }) => {
      const detail = row.original.detail || [];
      return (
        <div className="text-sm">
          {detail.length} {detail.length === 1 ? "item" : "items"}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal",
    cell: ({ row }) => (
      <div className="text-sm">
        {dayjs(row.original.createdAt).format("DD MMMM YYYY")}
      </div>
    ),
  },
  {
    accessorKey: "createdBy",
    header: "Dibuat Oleh",
    cell: ({ row }) => {
      const createdBy = row.original.createdBy;
      return (
        <span className="text-sm">{createdBy?.nama ?? "-"}</span>
      );
    },
  },
  {
    accessorKey: "pelanggan",
    header: "Pelanggan",
    cell: ({ row }) => {
      const p = row.original.pelanggan;
      return <span className="text-sm">{p?.nama ?? "Walk-in"}</span>;
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <div className="font-semibold">
        {formatCurrency(Number(row.original.total))}
      </div>
    ),
  },
  {
    id: "biayaKirim",
    header: "Biaya Kirim",
    cell: ({ row }) => {
      const v = row.original.biayaKirim;
      if (v == null || Number(v) === 0) return <span className="text-muted-foreground">-</span>;
      return <span className="text-sm">{formatCurrency(Number(v))}</span>;
    },
  },
  {
    id: "statusPengiriman",
    header: "Status Pengiriman",
    cell: ({ row }) => {
      const pengiriman = row.original.pengiriman;
      if (!pengiriman) return <span className="text-muted-foreground text-sm">Belum ada</span>;
      const status = pengiriman.status;
      const style = statusPengirimanStyle[status] ?? "bg-muted text-muted-foreground";
      return (
        <Badge variant="outline" className={style}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const penjualan = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => onViewDetail(penjualan.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            {onAddPengiriman && (
              <DropdownMenuItem
                onClick={() => onAddPengiriman(penjualan.id)}
                disabled={!!penjualan.pengiriman}
              >
                <Truck className="mr-2 h-4 w-4" />
                {penjualan.pengiriman ? "Sudah ada pengiriman" : "Tambah Pengiriman"}
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeleteClick(penjualan.id, penjualan.invoice)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
  },
];
