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
import { type Pensortiran } from "@/services/pensortiranService";
import dayjs from "@/lib/dayjs";
import { formatJumlahKg } from "@/lib/utils";

/**
 * Membuat columns definition untuk Pensortiran table
 */
export const createPensortiranColumns = (
  onDeleteClick: (id: string, name: string) => void,
  onConfirmClick?: (pensortiran: Pensortiran) => void,
  onViewDetail?: (id: string) => void
): ColumnDef<Pensortiran>[] => [
  {
    accessorKey: "invoice",
    header: "Invoice",
    cell: ({ row }) => {
      const id = row.original.id;
      const invoice = row.original.invoice;
      return (
        <Link
          href={`/pensortiran/${id}`}
          className="font-medium text-primary hover:underline"
        >
          {invoice || `ID: ${id}`}
        </Link>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "inspector",
    header: "Inspector",
    cell: ({ row }) => {
      const inspector = row.original.inspector;
      if (!inspector) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span>{inspector.nama}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "produk_jumlah",
    header: "Jumlah Input",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-1">
          {formatJumlahKg(row.original.produkJumlah)} KG
        </div>
      );
    },
  },
  {
    accessorKey: "hasil",
    header: "Hasil Sortir",
    cell: ({ row }) => {
      const data = row.original;
      const total =
        Number(data.jumlah_menir || 0) +
        Number(data.jumlah_abu || 0) +
        Number(data.jumlah_keping || 0) +
        Number(data.jumlah_bulat || 0) +
        Number(data.jumlah_busuk || 0);
      if (total === 0) return <span className="text-muted-foreground">-</span>;
      return <span className="text-sm">{total} kg</span>;
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
      return (
        <Badge
          variant="outline"
          className={`w-fit ${statusColors[status] || ""}`}
        >
          {status}
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
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={row.original.status !== "BERJALAN"}
            variant="destructive"
            onClick={() =>
              onDeleteClick(
                row.original.id,
                row.original.invoice || `Pensortiran ${row.original.id}`
              )
            }
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
