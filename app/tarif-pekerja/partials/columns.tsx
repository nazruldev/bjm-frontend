import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import type { TarifPekerjaItem } from "@/services/tarifPekerjaService";

/**
 * Membuat columns definition untuk Tarif Pekerja table
 */
export const createTarifPekerjaColumns = (
  onDeleteClick: (id: string, name: string) => void,
  onEditClick: (row: TarifPekerjaItem) => void
): ColumnDef<TarifPekerjaItem>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nama",
    header: "Nama / Label",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.nama || "—"}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "tipe",
    header: "Tipe",
    cell: ({ row }) => (
      <Badge variant={row.original.tipe === "PENJEMUR" ? "default" : "secondary"}>
        {row.original.tipe === "PENJEMUR" ? "Penjemur" : "Pengupas"}
      </Badge>
    ),
  },
  {
    accessorKey: "tarifPerKg",
    header: "Tarif (Rp/kg)",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 font-mono">
        <Coins className="size-4 text-muted-foreground" />
        {formatCurrency(Number(row.original.tarifPerKg))}
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
          <DropdownMenuItem onClick={() => onEditClick(row.original)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              onDeleteClick(
                row.original.id,
                row.original.nama || (row.original.tipe === "PENJEMUR" ? "Penjemur" : "Pengupas")
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
