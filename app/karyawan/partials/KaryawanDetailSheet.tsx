"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { type Karyawan } from "@/services/karyawanService";
import { formatCurrency } from "@/lib/utils";

const genderLabel: Record<number, string> = { 1: "Laki-laki", 2: "Perempuan" };

function getPhotoUrl(k: Karyawan | null): string | null {
  if (!k) return null;
  if (k.headPicUrl?.startsWith("http") || k.headPicUrl?.startsWith("data:"))
    return k.headPicUrl;
  if (k.faceBase64?.trim())
    return `data:image/jpeg;base64,${k.faceBase64.trim()}`;
  return null;
}

interface KaryawanDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  karyawan: Karyawan | null;
}

export function KaryawanDetailSheet({
  open,
  onOpenChange,
  karyawan,
}: KaryawanDetailSheetProps) {
  const photoUrl = React.useMemo(() => getPhotoUrl(karyawan), [karyawan]);
  const createdAt = karyawan?.createdAt
    ? new Date(karyawan.createdAt).toLocaleString("id-ID")
    : "—";
  const updatedAt = karyawan?.updatedAt
    ? new Date(karyawan.updatedAt).toLocaleString("id-ID")
    : "—";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-5">
        <SheetHeader>
          <SheetTitle>Detail karyawan</SheetTitle>
        </SheetHeader>
        {!karyawan ? (
          <p className="text-muted-foreground text-sm py-4">Tidak ada data.</p>
        ) : (
          <div className="py-4 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="size-24">
                <AvatarImage src={photoUrl ?? undefined} alt={karyawan.nama} />
                <AvatarFallback className="text-2xl">
                  {karyawan.nama.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold text-lg">{karyawan.nama}</p>
                {karyawan.gaji && (
                  <p className="text-muted-foreground text-sm">
                    Gaji: {karyawan.gaji.nama}
               
                  </p>
                )}
              </div>
            </div>

            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground mb-0.5">Telepon</dt>
                <dd>{karyawan.telepon ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-0.5">Email</dt>
                <dd>{karyawan.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-0.5">Jenis kelamin</dt>
                <dd>
                  {karyawan.gender != null && genderLabel[karyawan.gender]
                    ? genderLabel[karyawan.gender]
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-0.5">Alamat</dt>
                <dd className="whitespace-pre-wrap">{karyawan.alamat ?? "—"}</dd>
              </div>

              <div className="border-t pt-4 mt-2">
                <dt className="text-muted-foreground mb-2">Hik / ACS</dt>
                <dd className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Person ID: </span>
                    <span className="font-mono text-xs">{karyawan.personId ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Group ID: </span>
                    <span>{karyawan.groupId ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PIN: </span>
                    <span className="font-mono">{karyawan.pinCode ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Terdaftar Hik:</span>
                    <Badge variant={karyawan.personId ? "default" : "secondary"}>
                      {karyawan.personId ? "Ya" : "Belum"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Registrasi biometrik:</span>
                    <Badge variant={karyawan.isRegisteredBiometric ? "default" : "secondary"}>
                      {karyawan.isRegisteredBiometric ? "Lengkap" : "Belum lengkap"}
                    </Badge>
                  </div>
                  {Array.isArray(karyawan.accessLevelList) && karyawan.accessLevelList.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Access level (ID): </span>
                      <span className="font-mono text-xs">
                        {karyawan.accessLevelList.join(", ")}
                      </span>
                    </div>
                  )}
                </dd>
              </div>

              <div className="border-t pt-4 mt-2">
                <dt className="text-muted-foreground mb-0.5">Dibuat</dt>
                <dd>{createdAt}</dd>
                <dt className="text-muted-foreground mb-0.5 mt-2">Diperbarui</dt>
                <dd>{updatedAt}</dd>
              </div>

              <div>
                <dt className="text-muted-foreground mb-0.5">ID (internal)</dt>
                <dd className="font-mono text-xs">{karyawan.id}</dd>
              </div>
            </dl>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
