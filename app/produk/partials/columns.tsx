import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Package, ShoppingCart, Store, Settings, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { type Produk } from "@/services/produkService";

/**
 * Membuat columns definition untuk Produk table
 */
export const createProdukColumns = (
  onDeleteClick: (id: string, name: string) => void,
  onEditClick: (produk: Produk) => void
): ColumnDef<Produk>[] => [
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
          disabled={row.original.isPermanent}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nama_produk",
    header: "Nama Produk",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Package className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.original.nama_produk}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "harga_jual",
    header: "Harga Jual",
    cell: ({ row }) => {
      const harga = row.original.harga_jual;
      if (!harga) {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>-</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(Number(harga))}
          </span>
        </div>
      );
    },
  },
  {
    id: "bisa_dijual",
    header: "Bisa Dijual",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.bisa_dijual ? (
          <Badge variant="default" className="bg-green-500">
            <Store className="size-3 mr-1" />
            Ya
          </Badge>
        ) : (
          <Badge variant="secondary">Tidak</Badge>
        )}
      </div>
    ),
  },
  {
    id: "bisa_dibeli",
    header: "Bisa Dibeli",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.bisa_dibeli ? (
          <Badge variant="default" className="bg-blue-500">
            <ShoppingCart className="size-3 mr-1" />
            Ya
          </Badge>
        ) : (
          <Badge variant="secondary">Tidak</Badge>
        )}
      </div>
    ),
  },
  {
    id: "isInput",
    header: "Input",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.isInput ? (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            Input
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </div>
    ),
  },
  {
    id: "isOutput",
    header: "Output",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.isOutput ? (
          <Badge variant="outline" className="border-purple-500 text-purple-500">
            Output
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const permanent = row.original.isPermanent;
      return (
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
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {!permanent && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeleteClick(row.original.id, row.original.nama_produk)}
                >
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
