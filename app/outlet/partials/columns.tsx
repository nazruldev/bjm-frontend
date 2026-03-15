import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Building2, Phone, MapPin } from "lucide-react";

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
import { type Outlet } from "@/services/outletService";
import { outletService } from "@/services/outletService";

/**
 * Membuat columns definition untuk Outlet table
 */
export const createOutletColumns = (
  onDeleteClick: (id: string, name: string) => void,
  onEditClick: (outlet: Outlet) => void
): ColumnDef<Outlet>[] => [
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
    header: "Nama Outlet",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.original.nama}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "alamat",
    header: "Alamat",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="size-4" />
        <span>{row.original.alamat}</span>
      </div>
    ),
  },
  {
    accessorKey: "telepon",
    header: "No. Telepon",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Phone className="size-4" />
        <span>{row.original.telepon}</span>
      </div>
    ),
  },
  {
    accessorKey: "batasJamCheckinStart",
    header: "Check-in (mulai - akhir)",
    cell: ({ row }) => {
      const s = row.original.batasJamCheckinStart;
      const e = row.original.batasJamCheckinEnd;
      if (!s && !e) return <span>—</span>;
      if (s && e) return <span>{s} - {e}</span>;
      return <span>{s ?? e}</span>;
    },
  },
  {
    accessorKey: "batasJamCheckoutStart",
    header: "Check-out (mulai - akhir)",
    cell: ({ row }) => {
      const s = row.original.batasJamCheckoutStart;
      const e = row.original.batasJamCheckoutEnd;
      if (!s && !e) return <span>—</span>;
      if (s && e) return <span>{s} - {e}</span>;
      return <span>{s ?? e}</span>;
    },
  },
  {
    accessorKey: "logo",
    header: "Logo",
    cell: ({ row }) => {
      const src = outletService.getOutletLogoSrc(row.original.logo);
      return (
        <div>
          {src ? (
            <img
              src={src}
              alt={row.original.nama}
              className="size-10 rounded object-cover"
            />
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              No Logo
            </Badge>
          )}
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

