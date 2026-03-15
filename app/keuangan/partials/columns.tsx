import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type Keuangan } from "@/services/keuanganService";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/utils";

export const createKeuanganColumns = (
  onDeleteClick: (id: string, invoice: string) => void
): ColumnDef<Keuangan>[] => [
  {
    accessorKey: "arus",
    header: "Tipe",
    cell: ({ row }) => {
      const arus = row.original.arus ?? "KELUAR";
      return (
        <Badge variant={arus === "MASUK" ? "default" : "destructive"}>
          {arus === "MASUK" ? "Masuk" : "Keluar"}
        </Badge>
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
    accessorKey: "isCashless",
    header: "Metode Pembayaran",
    cell: ({ row }) => {
      const isCashless = row.original.isCashless === true;
      return (
        <Badge variant={isCashless ? "secondary" : "outline"}>
          {isCashless ? "Cashless" : "Tunai"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "invoice",
    header: "Invoice",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.original.invoice}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "total",
    header: "Jumlah",
    cell: ({ row }) => {
      const total = Number(row.original.total);
      const arus = row.original.arus ?? "KELUAR";
      return (
        <div className={arus === "MASUK" ? "font-medium text-green-600 dark:text-green-400" : "font-medium text-destructive"}>
          {arus === "MASUK" ? "+" : ""}{formatCurrency(total)}
        </div>
      );
    },
  },
  {
    accessorKey: "createdBy",
    header: "Dibuat Oleh",
    cell: ({ row }) => <div className="text-sm">{row.original.createdBy?.nama || "-"}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal",
    cell: ({ row }) => (
      <div className="text-sm">{dayjs(row.original.createdAt).format("DD MMMM YYYY")}</div>
    ),
  },
  {
    accessorKey: "catatan",
    header: "Catatan",
    cell: ({ row }) => {
      const catatan = row.original.catatan?.trim() || "";
      const display = catatan || "-";
      if (!catatan) return <div className="text-sm text-muted-foreground">-</div>;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-sm text-muted-foreground max-w-xs truncate cursor-default">
              {catatan}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm whitespace-pre-wrap wrap-break-word">
            {catatan}
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8" size="icon">
            <MoreVertical className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem variant="destructive" onClick={() => onDeleteClick(row.original.id, row.original.invoice)}>
            <Trash2 className="size-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
