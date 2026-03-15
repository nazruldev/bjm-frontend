import { type ColumnDef } from "@tanstack/react-table";
import { User, Phone, MapPin } from "lucide-react";
import { type Pelanggan } from "@/services/pelangganService";

export const createPelangganColumns = (): ColumnDef<Pelanggan>[] => [
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
    accessorKey: "telepon",
    header: "Telepon",
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
      <div className="flex items-center gap-2 text-muted-foreground max-w-[300px]">
        <MapPin className="size-4 shrink-0" />
        <span className="truncate" title={row.original.alamat ?? ""}>
          {row.original.alamat || "-"}
        </span>
      </div>
    ),
  },
];
