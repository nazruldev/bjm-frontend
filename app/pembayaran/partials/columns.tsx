"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, FileText, Trash2, Edit, ArrowUpRight, ArrowDownRight, CreditCard, Eye } from "lucide-react";
import type { Pembayaran } from "@/services/pembayaranService";
import { formatCurrency, formatDate } from "@/lib/utils";

/** Label tampilan untuk sumberType (enum dari backend) */
const getSumberTypeLabel = (sumberType: string): string => {
  if (sumberType === "PENGELUARAN") return "KEUANGAN";
  return sumberType;
};

/**
 * Get badge variant berdasarkan arus
 */
const getArusBadge = (arus: "MASUK" | "KELUAR") => {
  return arus === "MASUK" ? (
    <Badge variant="default" className="bg-green-600">
      {arus}
    </Badge>
  ) : (
    <Badge variant="destructive">
      {arus}
    </Badge>
  );
};

/**
 * Membuat columns definition untuk Pembayaran table
 */
export const createPembayaranColumns = (
  onEditClick?: (id: string) => void,
  onDeleteClick?: (id: string, invoice: string) => void,
  onViewDetail?: (id: string) => void
): ColumnDef<Pembayaran>[] => [
  {
    accessorKey: "invoice",
    header: "Invoice",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-muted-foreground" />
        <span className="font-mono font-medium">{row.original.invoice}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "sumberType",
    header: "Sumber",
    cell: ({ row }) => (
      <Badge variant="outline">{getSumberTypeLabel(row.original.sumberType)}</Badge>
    ),
  },
  {
    accessorKey: "arus",
    header: "Arus",
    cell: ({ row }) => getArusBadge(row.original.arus),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <div className="font-medium">{formatCurrency(row.original.total)}</div>
    ),
  },
  {
    accessorKey: "isCashless",
    header: "Metode",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.isCashless ? (
          <>
            <CreditCard className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {row.original.rekening
                ? `${row.original.rekening.bank} - ${row.original.rekening.nama}`
                : "Cashless"}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Tunai</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {onViewDetail && (
            <DropdownMenuItem
              onClick={() => onViewDetail(row.original.id)}
            >
              <Eye className="mr-2 size-4" />
              Lihat Detail
            </DropdownMenuItem>
          )}
          {onEditClick && (
            <DropdownMenuItem onClick={() => onEditClick(row.original.id)}>
              <Edit className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
          )}
          {onDeleteClick && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteClick(row.original.id, row.original.invoice)}
            >
              <Trash2 className="mr-2 size-4" />
              Hapus
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

