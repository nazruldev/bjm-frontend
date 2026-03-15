import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical, User, Phone, MapPin, Camera, Mail, BadgeCheck, ShieldCheck, Key, Eye, Link2, Pencil, Fingerprint, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Karyawan } from "@/services/karyawanService";

const genderLabel: Record<number, string> = { 1: "Laki-laki", 2: "Perempuan" };

/**
 * Membuat columns definition untuk Karyawan table
 */
export const createKaryawanColumns = (
  onDeleteClick: (id: string, name: string) => void,
  onEditClick: (karyawan: Karyawan) => void,
  onUploadPhotoClick?: (karyawan: Karyawan) => void,
  onAccessLevelClick?: (karyawan: Karyawan) => void,
  onPinClick?: (karyawan: Karyawan) => void,
  onDetailClick?: (karyawan: Karyawan) => void,
  onSelfServiceLinkClick?: (karyawan: Karyawan) => void,
  /** Aktifkan biometric: daftar ke device Hik (hanya tampil jika belum punya personId). */
  onAktifkanBiometricClick?: (karyawan: Karyawan) => void,
  /** Pindah outlet (hanya OWNER). */
  onPindahOutletClick?: (karyawan: Karyawan) => void,
  /** Hanya OWNER yang boleh atur access level; admin tidak. */
  canManageAccessLevel?: boolean
): ColumnDef<Karyawan>[] => [
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
    id: "foto",
    header: "Foto",
    cell: ({ row }) => {
      const k = row.original;
      const hasPhoto = !!k.headPicUrl;
      return (
        <div className="flex items-center justify-center">
          <Avatar className="size-9">
            <AvatarImage src={hasPhoto ? k.headPicUrl! : undefined} alt={k.nama} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {k.nama.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "nama",
    header: "Nama",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{row.original.nama}</span>
        {row.original.gaji && (
          <span className="text-muted-foreground text-xs">
            Gaji: {row.original.gaji.nama}
          </span>
        )}
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Mail className="size-4 shrink-0" />
        <span className="truncate max-w-[180px]" title={row.original.email ?? ""}>
          {row.original.email || "-"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "telepon",
    header: "Telepon",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Phone className="size-4 shrink-0" />
        <span>{row.original.telepon || "-"}</span>
      </div>
    ),
  },
  {
    accessorKey: "gender",
    header: "Jenis Kelamin",
    cell: ({ row }) => {
      const g = row.original.gender;
      return (
        <span className="text-muted-foreground text-sm">
          {g != null && genderLabel[g] ? genderLabel[g] : "-"}
        </span>
      );
    },
  },
  {
    accessorKey: "alamat",
    header: "Alamat",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-muted-foreground text-sm max-w-[200px]">
        <MapPin className="size-4 shrink-0" />
        <span className="truncate" title={row.original.alamat ?? ""}>
          {row.original.alamat || "-"}
        </span>
      </div>
    ),
  },
  {
    id: "hik",
    header: "Status Biometric",
    cell: ({ row }) => {
      const k = row.original;
      const hasPhoto = !!(k.headPicUrl && String(k.headPicUrl).trim());
      const hasPersonId = !!(k.personId && String(k.personId).trim());
      const hasAccessLevel = Array.isArray(k.accessLevelList) && k.accessLevelList.length > 0;
      const belumTerdaftar = !hasPersonId || !hasAccessLevel;
      const butuhBiometric = hasPersonId && hasAccessLevel && !hasPhoto;
      const terdaftar = hasPersonId && hasAccessLevel && hasPhoto;
      const label = terdaftar ? "Terdaftar" : butuhBiometric ? "Butuh biometric" : "Belum terdaftar";
      const variant = terdaftar ? "default" : butuhBiometric ? "secondary" : "outline";
      return (
        <Badge variant={variant} className="gap-1">
          <BadgeCheck className="size-3.5" />
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "pinCode",
    header: "PIN",
    cell: ({ row }) => {
      const pin = row.original.pinCode;
      const hasPin = pin != null && String(pin).trim() !== "";
      return (
        <div className="flex items-center gap-2 font-mono text-sm">
          <Key className="size-4 shrink-0 text-muted-foreground" />
          <span>{hasPin ? pin : "—"}</span>
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
          {onDetailClick && (
            <DropdownMenuItem onClick={() => onDetailClick(row.original)}>
              <Eye className="mr-2 size-4" />
              Detail
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onEditClick(row.original)}>
            <Pencil className="mr-2 size-4" />
            Edit
          </DropdownMenuItem>
          {onAktifkanBiometricClick &&
            !row.original.personId &&
            !row.original.isRegisteredBiometric && (
              <DropdownMenuItem
                onClick={() => onAktifkanBiometricClick(row.original)}
                title="Daftarkan karyawan ke device Hik (nama + PIN acak), isi access level default. Setelah itu bisa upload foto untuk absen."
              >
                <Fingerprint className="mr-2 size-4" />
                Aktifkan biometric
              </DropdownMenuItem>
            )}
          {onAccessLevelClick && canManageAccessLevel && (
            <DropdownMenuItem
              disabled={!row.original.personId}
              onClick={() => onAccessLevelClick(row.original)}
            >
              <ShieldCheck className="mr-2 size-4" />
              Atur access level
            </DropdownMenuItem>
          )}
          {onUploadPhotoClick && (
            <DropdownMenuItem
              disabled={
                !row.original.personId ||
                !Array.isArray(row.original.accessLevelList) ||
                row.original.accessLevelList.length === 0
              }
              onClick={() => onUploadPhotoClick(row.original)}
            >
              <Camera className="mr-2 size-4" />
              Upload foto
            </DropdownMenuItem>
          )}
          {onPinClick && (
            <DropdownMenuItem
              disabled={!row.original.personId}
              onClick={() => onPinClick(row.original)}
            >
              <Key className="mr-2 size-4" />
              Ganti PIN
            </DropdownMenuItem>
          )}
          {onSelfServiceLinkClick && (
            <DropdownMenuItem
              disabled={!row.original.personId}
              onClick={() => onSelfServiceLinkClick(row.original)}
            >
              <Link2 className="mr-2 size-4" />
              Link form mandiri
            </DropdownMenuItem>
          )}
          {onPindahOutletClick && canManageAccessLevel && (
            <DropdownMenuItem onClick={() => onPindahOutletClick(row.original)}>
              <Building2 className="mr-2 size-4" />
              Pindah outlet
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