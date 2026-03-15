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
import { MoreVertical, FileText, Trash2, Receipt } from "lucide-react";
import type { PiutangInvoice } from "@/services/piutangService";

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
 * Get badge variant berdasarkan status
 */
const getStatusBadge = (
  status: "PENDING" | "AKTIF" | "PARTIAL" | "LUNAS" | "DIBATALKAN"
) => {
  switch (status) {
    case "LUNAS":
      return "default";
    case "AKTIF":
      return "secondary";
    case "PARTIAL":
      return "outline";
    case "PENDING":
      return "destructive";
    case "DIBATALKAN":
      return "destructive";
    default:
      return "outline";
  }
};

/** canDelete: hanya OWNER yang boleh hapus; false sembunyikan aksi Hapus. */
export const createPiutangInvoiceColumns = (
  onDeleteClick: (id: string, invoice: string) => void,
  onViewPembayaran?: (invoiceId: string) => void,
  canDelete: boolean = true
): ColumnDef<PiutangInvoice>[] => [
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
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <div className="font-medium">{formatCurrency(row.original.total)}</div>
    ),
  },
  {
    accessorKey: "dibayar",
    header: "Dibayar",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {formatCurrency(row.original.dibayar)}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      // Explicitly cast out invalid "APPROVED" value if it comes up
      const status = (
        row.original.status === "APPROVED"
          ? "AKTIF"
          : row.original.status
      ) as "DIBATALKAN" | "PENDING" | "AKTIF" | "PARTIAL" | "LUNAS";
      return (
        <Badge variant={getStatusBadge(status)}>
          {row.original.status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      );
    },
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
          <DropdownMenuItem
            onClick={() => onViewPembayaran?.(row.original.id)}
          >
            <Receipt className="mr-2 size-4" />
            Riwayat Pembayaran
          </DropdownMenuItem>
          {canDelete && (
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

