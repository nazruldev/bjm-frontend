import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, User, Phone, MapPin, Briefcase } from "lucide-react";

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
import { type Pekerja } from "@/services/pekerjaService";

/**
 * Membuat columns definition untuk Pekerja table
 */
export const createPekerjaColumns = (
  onDeleteClick: (id: string, name: string) => void,
  onEditClick: (pekerja: Pekerja) => void
): ColumnDef<Pekerja>[] => [
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
    header: "Nama Pekerja",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.original.nama}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Tipe",
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge
          variant={type === "PENJEMUR" ? "default" : "secondary"}
          className="flex items-center gap-1 w-fit"
        >
          <Briefcase className="size-3" />
          {type === "PENJEMUR" ? "Penjemur" : "Pengupas"}
        </Badge>
      );
    },
  },
  {
    id: "tarif",
    header: "Tarif",
    cell: ({ row }) => {
      const tarif = row.original.tarifPekerja;
      if (!tarif) return <span className="text-muted-foreground">-</span>;
      const label = tarif.nama || (tarif.tipe === "PENJEMUR" ? "Penjemur" : "Pengupas");
      return (
        <span className="font-mono text-sm">
          {label} — Rp {Number(tarif.tarifPerKg).toLocaleString("id-ID")}/kg
        </span>
      );
    },
  },
  {
    accessorKey: "telepon",
    header: "No. Telepon",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Phone className="size-4" />
        <span>{row.original.telepon || "-"}</span>
      </div>
    ),
  },
  {
    accessorKey: "alamat",
    header: "Alamat",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="size-4" />
        <span>{row.original.alamat || "-"}</span>
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
            onClick={() => onDeleteClick(row.original.id, row.original.nama)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
