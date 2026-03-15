import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreVertical,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  XCircle,
  Calendar,
  FileText,
  Eye,
  Trash2,
} from "lucide-react";

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
import { type MutasiStok } from "@/services/mutasiStokService";
import dayjs from "@/lib/dayjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Component untuk dialog lihat catatan lengkap
 */
function KeteranganDialog({
  open,
  onOpenChange,
  keterangan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keterangan: string | null | undefined;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catatan Lengkap</DialogTitle>
          <DialogDescription>Detail keterangan mutasi stok</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {keterangan ? (
            <p className="text-sm whitespace-pre-wrap">{keterangan}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tidak ada keterangan
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Membuat columns definition untuk MutasiStok table
 */
export const createMutasiStokColumns = (
  onDeleteClick: (id: string, name: string) => void,
  onViewSource: (mutasiStok: MutasiStok) => void,
  onViewDetail?: (produkId: string) => void
): ColumnDef<MutasiStok>[] => [
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
    accessorKey: "jumlah",
    header: "Jumlah",
    cell: ({ row }) => {
      const jumlah = Number(row.original.jumlah);
      const satuan = row.original.produk?.satuan || "";
      return (
        <div className="font-medium">
          {jumlah.toLocaleString("id-ID")} {satuan} KG
        </div>
      );
    },
  },
  {
    accessorKey: "tipe",
    header: "Tipe",
    cell: ({ row }) => {
      const tipe = row.original.tipe;
      type Tipe = NonNullable<MutasiStok["tipe"]>;
      const tipeConfig = {
        MASUK: {
          icon: TrendingUp,
          label: "Masuk",
          variant: "default" as const,
          className: "bg-green-500",
        },
        KELUAR: {
          icon: TrendingDown,
          label: "Keluar",
          variant: "default" as const,
          className: "bg-red-500",
        },
        SUSUT: {
          icon: AlertTriangle,
          label: "Susut",
          variant: "default" as const,
          className: "bg-yellow-500",
        },
        HILANG: {
          icon: XCircle,
          label: "Hilang",
          variant: "default" as const,
          className: "bg-orange-500",
        },
        RUSAK: {
          icon: AlertTriangle,
          label: "Rusak",
          variant: "default" as const,
          className: "bg-amber-600 text-white",
        },
      } satisfies Record<
        Tipe,
        {
          icon: React.ComponentType<{ className?: string }>;
          label: string;
          variant: "default";
          className: string;
        }
      >;

      // Handle unknown tipe values safely
      const config = tipeConfig[tipe as Tipe];
      if (!config) {
        return (
          <Badge variant="outline" className="bg-gray-400">
            <span className="mr-1">?</span>
            Tidak Diketahui
          </Badge>
        );
      }
      const Icon = config.icon;

      return (
        <Badge variant={config.variant} className={config.className}>
          <Icon className="size-3 mr-1" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "tanggal",
    header: "Tanggal",
    cell: ({ row }) => {
      const tanggal = row.original.tanggal;
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
    id: "sumber",
    header: "Sumber",
    cell: ({ row }) => {
      const penjemuran = row.original.penjemuran;
      const pembelian = row.original.pembelian;
      const penjemuranId = row.original.penjemuranId;
      const pembelianId = row.original.pembelianId;

      // Jika ada penjemuran
      if (penjemuran) {
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit">
              <Package className="size-3 mr-1" />
              Penjemuran
            </Badge>
            {/* <div className="text-xs text-muted-foreground">
              {penjemuran.ProdukProduksiPreset && (
                <div>Tipe: {penjemuran.ProdukProduksiPreset.tipeProses}</div>
              )}
              {penjemuran.status && <div>Status: {penjemuran.status}</div>}
              {penjemuran.invoice && (
                <div>Invoice: {penjemuran.invoice}</div>
              )}
              {penjemuranId && (
                <div className="font-mono text-[10px] mt-1">ID: {penjemuranId}</div>
              )}
            </div> */}
          </div>
        );
      }

      // Jika ada penjemuranId tapi data penjemuran belum di-load
      if (penjemuranId && !penjemuran) {
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit">
              <Package className="size-3 mr-1" />
              Penjemuran
            </Badge>
            {/* <div className="text-xs text-muted-foreground font-mono">
              ID: {penjemuranId}
            </div> */}
          </div>
        );
      }

      // Jika ada pembelian
      if (pembelian) {
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit">
              <Package className="size-3 mr-1" />
              Pembelian
            </Badge>
            {/* <div className="text-xs text-muted-foreground">
              <div className="font-medium">Invoice: {pembelian.invoice}</div>
              {pembelian.pemasok && (
                <div>Pemasok: {pembelian.pemasok.nama}</div>
              )}
              {pembelian.total && (
                <div>Total: Rp {Number(pembelian.total).toLocaleString("id-ID")}</div>
              )}
              {pembelianId && (
                <div className="font-mono text-[10px] mt-1">ID: {pembelianId}</div>
              )}
            </div> */}
          </div>
        );
      }

      // Jika ada pembelianId tapi data pembelian belum di-load
      if (pembelianId && !pembelian) {
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit">
              <Package className="size-3 mr-1" />
              Pembelian
            </Badge>
            {/* <div className="text-xs text-muted-foreground font-mono">
              ID: {pembelianId}
            </div> */}
          </div>
        );
      }

      return (
        <Badge variant="secondary" className="w-fit">
          Manual
        </Badge>
      );
    },
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
    cell: ({ row }) => {
      const keterangan = row.original.keterangan;
      const [showDialog, setShowDialog] = React.useState(false);

      if (!keterangan) {
        return <span className="text-muted-foreground">-</span>;
      }

      const maxLength = 50;
      const truncated =
        keterangan.length > maxLength
          ? keterangan.substring(0, maxLength) + "..."
          : keterangan;

      return (
        <>
          <div className="flex items-center gap-2 text-muted-foreground max-w-xs">
            <FileText className="size-4 shrink-0" />
            <span className="truncate" title={keterangan}>
              {truncated}
            </span>
            {keterangan.length > maxLength && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setShowDialog(true)}
              >
                <Eye className="size-3 mr-1" />
                Lihat
              </Button>
            )}
          </div>
          <KeteranganDialog
            open={showDialog}
            onOpenChange={setShowDialog}
            keterangan={keterangan}
          />
        </>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const mutasiStok = row.original;
      const hasSource =
        mutasiStok.penjemuranId ||
        mutasiStok.pembelianId ||
        mutasiStok.pengupasanId ||
        mutasiStok.pensortiranId ||
        mutasiStok.penjualanId;

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
            {hasSource && (
              <>
                <DropdownMenuItem onClick={() => onViewSource(mutasiStok)}>
                  <Eye className="size-4 mr-2" />
                  Lihat Sumber
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                onDeleteClick(
                  mutasiStok.id,
                  `${mutasiStok.produk?.nama_produk || "Mutasi"} - ${mutasiStok.tipe}`
                )
              }
            >
              <Trash2 className="size-4 mr-2" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
