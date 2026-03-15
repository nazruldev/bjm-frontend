import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Building2, CreditCard, Hash, CheckCircle2, XCircle } from "lucide-react";

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
import { type Rekening } from "@/services/rekeningService";

/**
 * Membuat columns definition untuk Rekening table
 */
export const createRekeningColumns = (
  onDeleteClick: (id: string, name: string) => void,
  onEditClick: (rekening: Rekening) => void
): ColumnDef<Rekening>[] => [
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
    accessorKey: "bank",
    header: "Bank",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.original.bank}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "nama",
    header: "Nama Rekening",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <CreditCard className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.original.nama}</span>
      </div>
    ),
  },
  {
    accessorKey: "nomor",
    header: "Nomor Rekening",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Hash className="size-4" />
        <span className="font-mono">{row.original.nomor}</span>
      </div>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge
          variant={isActive ? "default" : "secondary"}
          className="flex items-center gap-1 w-fit"
        >
          {isActive ? (
            <>
              <CheckCircle2 className="size-3" />
              Aktif
            </>
          ) : (
            <>
              <XCircle className="size-3" />
              Nonaktif
            </>
          )}
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
          <DropdownMenuItem onClick={() => onEditClick(row.original)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDeleteClick(row.original.id, row.original.nama)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];