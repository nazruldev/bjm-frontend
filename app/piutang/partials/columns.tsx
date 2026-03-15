import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, User, FileText, Eye, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type PiutangGrouped, type PiutangInvoice } from "@/services/piutangService";

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
 * Get status badge variant
 */
const getStatusBadge = (status: string) => {
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

/**
 * Membuat columns definition untuk Piutang grouped table
 */
export const createPiutangGroupedColumns = (
  onViewDetail: (
    subjekId: string,
    subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK"
  ) => void,
  onBayarClick: (subjekId: string, subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK", name: string) => void
): ColumnDef<PiutangGrouped>[] => [
  {
    accessorKey: "user",
    header: "Subjek",
    cell: ({ row }) => {
      const user = row.original.user;
      const { subjekId, subjekType } = row.original;
      if (!user) {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="size-4" />
            <span>-</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground shrink-0" />
          <button
            type="button"
            onClick={() => onViewDetail(subjekId, subjekType)}
            className="font-medium text-primary hover:underline text-left"
          >
            {user.nama}
          </button>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "subjekType",
    header: "Tipe",
    cell: ({ row }) => {
      const type = row.original.subjekType;
      return (
        <Badge variant="outline">
          {type === "KARYAWAN"
            ? "Karyawan"
            : type === "PEKERJA"
            ? "Pekerja"
            : "Pemasok"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "totalPiutang",
    header: "Total Piutang",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{formatCurrency(row.original.totalPiutang)}</span>
      </div>
    ),
  },
  {
    accessorKey: "totalDibayar",
    header: "Total Dibayar",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {formatCurrency(row.original.totalDibayar)}
      </div>
    ),
  },
  {
    accessorKey: "sisaPiutang",
    header: "Sisa Piutang",
    cell: ({ row }) => (
      <div className="font-semibold text-destructive">
        {formatCurrency(row.original.sisaPiutang)}
      </div>
    ),
  },
  {
    accessorKey: "jumlahInvoice",
    header: "Jumlah Invoice",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-muted-foreground" />
        <span>{row.original.jumlahInvoice}</span>
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
          <DropdownMenuItem
            onClick={() =>
              onBayarClick(
                row.original.subjekId,
                row.original.subjekType,
                row.original.user?.nama || "Piutang"
              )
            }
          >
            <CreditCard className="mr-2 size-4" />
            Bayar Kasbon
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              onViewDetail(row.original.subjekId, row.original.subjekType)
            }
          >
            <Eye className="mr-2 size-4" />
            Lihat Detail
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

/** canDelete: hanya OWNER yang boleh hapus. */
export const createPiutangInvoiceColumns = (
  onDeleteClick: (id: string, invoice: string) => void,
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
    cell: ({ row }) => (
      <Badge variant={getStatusBadge(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
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
          {canDelete && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteClick(row.original.id, row.original.invoice)}
            >
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

