import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Clock, User, Calendar, Fingerprint, Pencil } from "lucide-react";

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
import { type Absensi } from "@/services/absensiService";
import { formatDate, formatCurrency, formatDecimal } from "@/lib/utils";

/**
 * Membuat columns definition untuk Absensi table
 */
export const createAbsensiColumns = (
  onDeleteClick: (id: string, name: string) => void,
  onEditClick: (absensi: Absensi) => void
): ColumnDef<Absensi>[] => [
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
      cell: ({ row }) => {
        const locked = !!row.original.penggajianId;
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => !locked && row.toggleSelected(!!value)}
              disabled={locked}
              aria-label="Select row"
            />
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "karyawan.nama",
      header: "Karyawan",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span className="font-medium">{row.original.karyawan?.nama || "-"}</span>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "tanggal",
      header: "Tanggal",
      cell: ({ row }) => {
        const tanggal = row.original.tanggal;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span>{tanggal ? formatDate(tanggal) : "-"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "jam_masuk",
      header: "Jam Masuk",
      cell: ({ row }) => {
        const jamMasuk = row.original.jam_masuk;
        if (!jamMasuk) return "-";

        return (
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <span>{jamMasuk}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "jam_keluar",
      header: "Jam Keluar",
      cell: ({ row }) => {
        const jamKeluar = row.original.jam_keluar;
        if (!jamKeluar) {
          return <Badge variant="outline">Belum Keluar</Badge>;
        }

        return (
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <span>{jamKeluar}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "total_jam",
      header: "Total Jam",
      cell: ({ row }) => {
        const totalJam = row.original.total_jam;
        if (totalJam === null || totalJam === undefined) {
          return <Badge variant="outline">-</Badge>;
        }
        // Handle Decimal type from Prisma (convert to number first)
        const totalJamNum = typeof totalJam === "number" ? totalJam : Number(totalJam);
        if (isNaN(totalJamNum)) {
          return <Badge variant="outline">0 Jam</Badge>;
        }
        // Jangan tampilkan minus: jam keluar < jam masuk (mis. shift malam) → tampilkan 0
        const displayJam = totalJamNum < 0 ? 0 : totalJamNum;
        return (
          <Badge variant="default">
            {formatDecimal(displayJam)} jam
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        if (!status) return <span className="text-muted-foreground">—</span>;
        return status === "HADIR" ? (
          <Badge variant="default">HADIR</Badge>
        ) : (
          <Badge variant="secondary">TIDAK HADIR</Badge>
        );
      },
    },
    {
      accessorKey: "sumberAbsensi",
      header: "Sumber",
      cell: ({ row }) => {
        const sumber = row.original.sumberAbsensi;
        if (sumber === "ALAT") {
          return (
            <Badge variant="secondary" className="gap-1">
              <Fingerprint className="size-3" />
              Alat
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="gap-1">
            <Pencil className="size-3" />
            Manual
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
            <DropdownMenuItem
              disabled={!!row.original.penggajianId}
              onClick={() => !row.original.penggajianId && onEditClick(row.original)}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <span>Edit</span>
              {row.original.penggajianId && (
                <span className="text-xs text-muted-foreground font-normal">
                  Tidak bisa diedit karena sudah masuk Penggajian
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={!!row.original.penggajianId || row.original.sumberAbsensi === "ALAT"}
              onClick={() => {
                if (row.original.penggajianId || row.original.sumberAbsensi === "ALAT") return;
                onDeleteClick(
                  row.original.id,
                  `${row.original.karyawan?.nama || "Absensi"} - ${formatDate(row.original.tanggal)}`
                );
              }}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <span>Delete</span>
              {row.original.penggajianId && (
                <span className="text-xs text-muted-foreground font-normal">
                  Tidak bisa dihapus karena sudah masuk Penggajian
                </span>
              )}
              {!row.original.penggajianId && row.original.sumberAbsensi === "ALAT" && (
                <span className="text-xs text-muted-foreground font-normal">
                  Absensi dari alat tidak dapat dihapus
                </span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

