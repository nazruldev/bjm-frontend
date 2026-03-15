import * as React from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreVertical,
  Calendar,
  FileText,
  User,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { type Penjemuran } from "@/services/penjemuranService";
import dayjs from "@/lib/dayjs";
import { formatJumlahKg } from "@/lib/utils";

/**
 * Membuat columns definition untuk Penjemuran table
 * @param inspectorOnly - true = hanya tampilkan Detail & Konfirmasi (sembunyikan Delete)
 */
export const createPenjemuranColumns = (
  onDeleteClick: (id: string, name: string) => void,
  onConfirmClick?: (penjemuran: Penjemuran) => void,
  onViewDetail?: (id: string) => void,
  inspectorOnly?: boolean
): ColumnDef<Penjemuran>[] => [
  {
    accessorKey: "invoice",
    header: "Invoice",
    cell: ({ row }) => {
      const id = row.original.id;
      const invoice = row.original.invoice;
      return (
        <Link
          href={`/penjemuran/${id}`}
          className="font-medium text-primary hover:underline"
        >
          {invoice || `ID: ${id}`}
        </Link>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "pekerja",
    header: "Pekerja",
    cell: ({ row }) => {
      const pekerja = row.original.pekerja;
      if (!pekerja) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span>{pekerja.nama}</span>
        </div>
      );
    },
  },
  
  {
    accessorKey: "produk_jumlah",
    header: "Quantity",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-1">
          {formatJumlahKg(row.original.produkJumlah)} KG
        </div>
      );
    },
  },
  {
    accessorKey: "upah_satuan",
    header: "Upah Satuan",
    cell: ({ row }) => {
      const upah = Number(row.original.upah_satuan);
      return (
        <div className="font-medium">Rp {upah.toLocaleString("id-ID")}</div>
      );
    },
  },
  {
    accessorKey: "total_upah",
    header: "Total Upah",
    cell: ({ row }) => {
      const total = row.original.total_upah;
      if (!total) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="font-medium">
          Rp {Number(total).toLocaleString("id-ID")}
        </div>
      );
    },
  },
  {
    accessorKey: "tanggal_mulai",
    header: "Tanggal Mulai",
    cell: ({ row }) => {
      const tanggal = row.original.tanggal_mulai;
      if (!tanggal) return <span className="text-muted-foreground">-</span>;
      const date = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="size-4" />
          <span>{dayjs(date).format("DD MMM YYYY")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "tanggal_selesai",
    header: "Tanggal Selesai",
    cell: ({ row }) => {
      const tanggal = row.original.tanggal_selesai;
      if (!tanggal) return <span className="text-muted-foreground">-</span>;
      const date = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="size-4" />
          <span>{dayjs(date).format("DD MMM YYYY")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColors: Record<string, string> = {
        BERJALAN: "bg-yellow-500",
        SELESAI: "bg-green-500",
        DIBATALKAN: "bg-red-500",
      };
      const statusLabels: Record<string, string> = {
        MENUNGGU_APPROVAL: "Menunggu Approval Owner",
      };
      if (status === "MENUNGGU_APPROVAL") {
        return <Badge variant="secondary">{statusLabels[status] || status}</Badge>;
      }
      return (
        <Badge
          variant="outline"
          className={`w-fit ${statusColors[status] || ""}`}
        >
          {statusLabels[status] || status}
        </Badge>
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
          <DropdownMenuItem onClick={() => onViewDetail?.(row.original.id)}>
            Detail
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={row.original.status !== "BERJALAN"}
            onClick={() => onConfirmClick?.(row.original)}
          >
            Konfirmasi
          </DropdownMenuItem>
          {!inspectorOnly && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={row.original.status !== "BERJALAN"}
                variant="destructive"
                onClick={() =>
                  onDeleteClick(
                    row.original.id,
                    row.original.invoice || `Penjemuran ${row.original.id}`
                  )
                }
              >
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
