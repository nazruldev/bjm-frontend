"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { karyawanService, type Karyawan } from "@/services/karyawanService";
import { useQueryClient } from "@tanstack/react-query";
import { karyawanKeys } from "@/hooks/useKaryawans";

interface AccessLevelItem {
  id: string;
  name: string;
}

interface KaryawanAccessLevelSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  karyawan: Karyawan | null;
}

export function KaryawanAccessLevelSheet({
  open,
  onOpenChange,
  karyawan,
}: KaryawanAccessLevelSheetProps) {
  const queryClient = useQueryClient();
  const [list, setList] = React.useState<AccessLevelItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    // Default selected = access level yang sudah diatur sebelumnya (by id)
    const existingIds =
      Array.isArray(karyawan?.accessLevelList) && karyawan.accessLevelList.length > 0
        ? new Set(karyawan.accessLevelList as string[])
        : new Set<string>();

    karyawanService
      .getAccessLevelList()
      .then((res) => {
        // Backend returns { success, data: HikPayload }; Hik: data.accessLevelResponse.accessLevelList
        const arr =
          (res.data as any)?.data?.accessLevelResponse?.accessLevelList ?? [];
        setList(Array.isArray(arr) ? arr : []);
        setSelectedIds(existingIds);
      })
      .catch(() => {
        toast.error("Gagal memuat daftar access level.");
        setList([]);
      })
      .finally(() => setLoading(false));
  }, [open, karyawan?.id]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!karyawan?.id) return;
    if (selectedIds.size === 0) {
      toast.error("Pilih minimal satu access level.");
      return;
    }
    setSubmitting(true);
    try {
      await karyawanService.addKaryawanAccessLevel(
        karyawan.id,
        Array.from(selectedIds)
      );
      toast.success("Access level berhasil ditambah. Karyawan bisa scan di device yang terhubung.");
      queryClient.invalidateQueries({ queryKey: karyawanKeys.lists() });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? e?.message ?? "Gagal menambah access level.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col ">
        <SheetHeader>
          <SheetTitle>Atur access level — {karyawan?.nama ?? ""}</SheetTitle>
          <p className="text-muted-foreground text-sm">
            Pilih access level agar karyawan bisa scan di device yang terhubung.
          </p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4 space-y-2 p-5">
          {loading && (
            <p className="text-muted-foreground text-sm">Memuat daftar...</p>
          )}
          {!loading && list.length === 0 && (
            <p className="text-muted-foreground text-sm">Tidak ada access level.</p>
          )}
          {!loading &&
            list.map((item) => (
              <div className="border p-3">
                <label
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg  cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox className="cursor-pointer mt-1"
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggle(item.id)}
                  />

                  <div>
                    <span className="font-medium">{item.name}</span>
                    <div className="text-muted-foreground text-xs">({item.id})</div>
                  </div>
                </label>

              </div>

            ))}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={list.length === 0 || selectedIds.size === 0 || submitting}>
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
