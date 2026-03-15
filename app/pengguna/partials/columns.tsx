import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, User, Mail, Building2, Shield, KeyRound } from "lucide-react";

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
import { type Pengguna } from "@/services/penggunaService";

/**
 * Membuat columns definition untuk Pengguna table
 */
export const createPenggunaColumns = (
  onDeleteClick: (id: string, name: string) => void,
  onEditClick: (pengguna: Pengguna) => void,
  onResetPasswordClick?: (pengguna: Pengguna) => void
): ColumnDef<Pengguna>[] => [
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
    header: "Nama",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.original.nama}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Mail className="size-4" />
        <span>{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role;
      const roleLabels: Record<string, string> = {
        ADMIN: "Admin",
        KASIR: "Kasir",
        INSPECTOR: "Inspector",
      };
      const roleVariants: Record<string, "default" | "secondary" | "outline"> = {
        ADMIN: "default",
        KASIR: "secondary",
        INSPECTOR: "outline",
      };
      return (
        <Badge
          variant={roleVariants[role] || "secondary"}
          className="flex items-center gap-1 w-fit"
        >
          <Shield className="size-3" />
          {roleLabels[role] || role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "outlet",
    header: "Outlet",
    cell: ({ row }) => {
      const outlet = row.original.outlet;
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="size-4" />
          <span>{outlet?.nama || "-"}</span>
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
          {onResetPasswordClick && (
            <DropdownMenuItem onClick={() => onResetPasswordClick(row.original)}>
             
              Reset Password
            </DropdownMenuItem>
          )}
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