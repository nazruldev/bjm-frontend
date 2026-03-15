import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, FileText, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Pembelian } from "@/services/pembelianService";
import dayjs from "@/lib/dayjs";

/**
 * Format currency IDR
 */
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Membuat columns definition untuk Pembelian table.
 * canDelete: hanya OWNER yang boleh hapus; false sembunyikan aksi Hapus.
 */
export const createPembelianColumns = (
  onViewDetail: (id: string) => void,
  onDeleteClick: (id: string, invoice: string) => void,
  canDelete: boolean = true
): ColumnDef<Pembelian>[] => [
  {
    accessorKey: "invoice",
    header: "Invoice",
    cell: ({ row }) => {
      const invoice = row.original.invoice;
      return (
        <div onClick={() => onViewDetail(row.original.id)} className="flex items-center gap-2 cursor-pointer hover:text-primary">
          <FileText className="size-4 text-muted-foreground" />
          <span className="font-medium">{invoice}</span>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "pemasok",
    header: "Pemasok",
    cell: ({ row }) => {
      const pemasok = row.original.pemasok;
      if (!pemasok) {
        return <span className="text-muted-foreground">Walk-in</span>;
      }
      return <span className="font-medium">{pemasok.nama}</span>;
    },
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
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <div className="text-sm">
          {dayjs(date).format("DD MMMM YYYY")}
        </div>
      );
    },
  },
  {
    accessorKey: "createdBy",
    header: "Dibuat Oleh",
    cell: ({ row }) => {
      const createdBy = row.original.createdBy;
      if (!createdBy) {
        return <span className="text-muted-foreground">-</span>;
      }
      return <span className="text-sm">{createdBy.nama}</span>;
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      const total = Number(row.original.total);
      return (
        <div className="font-semibold ">
          {formatCurrency(total)}
        </div>
      );
    },
  },
  {
    accessorKey: "statusPembayaran",
    header: "Status Pembayaran",
    cell: ({ row }) => {
      const status = row.original.statusPembayaran ?? "LUNAS";
      const label =
        status === "LUNAS"
          ? "Selesai"
          : status === "MENUNGGU_APPROVAL"
            ? "Menunggu Approval"
            : "Ditolak";
      const variant =
        status === "LUNAS"
          ? "default"
          : status === "MENUNGGU_APPROVAL"
            ? "secondary"
            : "destructive";
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const pembelian = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => onViewDetail(pembelian.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeleteClick(pembelian.id, pembelian.invoice)}
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



