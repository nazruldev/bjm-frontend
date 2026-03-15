"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Package, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { type ProdukWithStok } from "@/services/mutasiStokService";

/**
 * Membuat columns definition untuk ProdukWithStok table
 */
export const createProdukWithStokColumns = (
  onViewDetail?: (produkId: string) => void,
  onAddMutasiStok?: (produkId: string) => void
): ColumnDef<ProdukWithStok>[] => [
  {
    accessorKey: "nama_produk",
    header: "Produk",
    cell: ({ row }) => {
      const produk = row.original;
      return (
        <div className="flex items-center gap-2">
          <Package className="size-4 text-muted-foreground" />
          <button
            onClick={() => onViewDetail?.(produk.id)}
            className="font-medium hover:underline text-left"
          >
            {produk.nama_produk}
          </button>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "satuan",
    header: "Satuan",
    cell: ({ row }) => {
      return <div className="text-muted-foreground">{row.original.satuan}</div>;
    },
  },
  {
    accessorKey: "stok.masuk",
    header: "Stok Masuk",
    cell: ({ row }) => {
      const stok = row.original.stok;
      return (
        <div className="font-medium text-green-600">
          {stok.masuk.toLocaleString("id-ID")} {row.original.satuan}
        </div>
      );
    },
  },
  {
    accessorKey: "stok.keluar",
    header: "Stok Keluar",
    cell: ({ row }) => {
      const stok = row.original.stok;
      return (
        <div className="font-medium text-red-600">
          {stok.keluar.toLocaleString("id-ID")} {row.original.satuan}
        </div>
      );
    },
  },
  {
    accessorKey: "stok.susut",
    header: "Stok Susut",
    cell: ({ row }) => {
      const stok = row.original.stok;
      return (
        <div className="font-medium text-yellow-600">
          {stok.susut.toLocaleString("id-ID")} {row.original.satuan}
        </div>
      );
    },
  },
  {
    accessorKey: "stok.hilang",
    header: "Stok Hilang",
    cell: ({ row }) => {
      const stok = row.original.stok;
      return (
        <div className="font-medium text-orange-600">
          {stok.hilang.toLocaleString("id-ID")} {row.original.satuan}
        </div>
      );
    },
  },
  {
    accessorKey: "stok.rusak",
    header: "Stok Rusak",
    cell: ({ row }) => {
      const stok = row.original.stok;
      return (
        <div className="font-medium text-red-600">
          {stok.rusak.toLocaleString("id-ID")} {row.original.satuan}
        </div>
      );
    },
  },
  {
    accessorKey: "stok.saldoAkhir",
    header: "Saldo Akhir",
    cell: ({ row }) => {
      const stok = row.original.stok;
      const saldoAkhir = stok.saldoAkhir;
      return (
        <div
          className={`font-bold text-lg ${
            saldoAkhir < 0 ? "text-destructive" : "text-primary"
          }`}
        >
          {saldoAkhir.toLocaleString("id-ID")} {row.original.satuan}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const produk = row.original;
      return (
        <DropdownMenu >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => onViewDetail?.(produk.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Detail
            </DropdownMenuItem>
            <DropdownMenuItem className=" whitespace-nowrap" onClick={() => onAddMutasiStok?.(produk.id)}>
              <Plus className="mr-2 h-4 w-4" />
              Mutasi
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
  },
];

