import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Eye, Truck, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Pengiriman } from "@/services/pengirimanService";
import dayjs from "@/lib/dayjs";
import { Badge } from "@/components/ui/badge";

const statusPengirimanStyle: Record<string, string> = {
  MENUNGGU: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
  DALAM_PENGIRIMAN: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
  SELESAI: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
  DIBATALKAN: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",
};

export const createPengirimanColumns = (
  onViewDetail: (id: string) => void,
  onViewPenjualan?: (id: string) => void,
  onOpenUpdateStatus?: (pengiriman: Pengiriman) => void
): ColumnDef<Pengiriman>[] => [
  {
    accessorKey: "penjualan",
    header: "Invoice",
    cell: ({ row }) => {
      const p = row.original.penjualan;
      if (!p) return "-";
      return (
        <button
          type="button"
          onClick={() => onViewPenjualan?.(p.id)}
          className="font-medium text-primary hover:underline"
        >
          {p.invoice}
        </button>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "penjualan.pelanggan",
    header: "Pelanggan",
    cell: ({ row }) => {
      const p = row.original.penjualan?.pelanggan;
      return <span className="text-sm">{p?.nama ?? "Walk-in"}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const style = statusPengirimanStyle[status] ?? "bg-muted text-muted-foreground";
      return (
        <Badge variant="outline" className={style}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "alamatKirim",
    header: "Alamat Kirim",
    cell: ({ row }) => (
      <span className="text-sm max-w-[200px] truncate block" title={row.original.alamatKirim ?? ""}>
        {row.original.alamatKirim ?? "-"}
      </span>
    ),
  },
  {
    accessorKey: "namaKurir",
    header: "Kurir",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.namaKurir ?? "-"}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat",
    cell: ({ row }) => (
      <span className="text-sm">
        {dayjs(row.original.createdAt).format("DD MMM YYYY")}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => onViewDetail(row.original.id)}>
            <Eye className="mr-2 h-4 w-4" />
            Lihat Detail
          </DropdownMenuItem>
          {onOpenUpdateStatus && (
            <DropdownMenuItem onClick={() => onOpenUpdateStatus(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Update Status
            </DropdownMenuItem>
          )}
          {row.original.penjualan && (
            <DropdownMenuItem onClick={() => onViewPenjualan?.(row.original.penjualan!.id)}>
              <Truck className="mr-2 h-4 w-4" />
              Lihat Penjualan
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
  },
];
