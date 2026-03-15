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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { karyawanService, type Karyawan } from "@/services/karyawanService";
import { useQueryClient } from "@tanstack/react-query";
import { karyawanKeys } from "@/hooks/useKaryawans";

function generatePinCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const PIN_MIN = 4;
const PIN_MAX = 8;

interface KaryawanPinSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  karyawan: Karyawan | null;
}

export function KaryawanPinSheet({
  open,
  onOpenChange,
  karyawan,
}: KaryawanPinSheetProps) {
  const queryClient = useQueryClient();
  const [newPin, setNewPin] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const displayPreviousPin = karyawan?.pinCode ?? "—";

  React.useEffect(() => {
    if (!open) setNewPin("");
  }, [open, karyawan?.id]);

  const handleGenerate = () => {
    setNewPin(generatePinCode());
  };

  const handleSubmit = async () => {
    if (!karyawan?.id) return;
    const pin = newPin.trim();
    if (pin.length < PIN_MIN || pin.length > PIN_MAX) {
      toast.error(`PIN harus ${PIN_MIN}–${PIN_MAX} digit.`);
      return;
    }
    if (!/^\d+$/.test(pin)) {
      toast.error("PIN harus angka saja.");
      return;
    }
    setSubmitting(true);
    try {
      await karyawanService.updateKaryawanPin(karyawan.id, pin);
      toast.success("PIN berhasil diganti.");
      queryClient.invalidateQueries({ queryKey: karyawanKeys.lists() });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? e?.message ?? "Gagal ganti PIN.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Ganti PIN — {karyawan?.nama ?? ""}</SheetTitle>
          <p className="text-muted-foreground text-sm">
            PIN biometric: 4–8 digit. Dipakai untuk scan di device.
          </p>
        </SheetHeader>
        <div className="flex flex-col gap-4  p-5">
          <div className="space-y-2">
            <Label>PIN sebelumnya</Label>
            <div className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm">
              {displayPreviousPin}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pin">PIN baru</Label>
            <div className="flex gap-2">
              <Input
                id="new-pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={`${PIN_MIN}-${PIN_MAX} digit`}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, PIN_MAX))}
                className="font-mono"
              />
              <Button type="button" variant="outline" onClick={handleGenerate}>
                Generate
              </Button>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={newPin.length < PIN_MIN || newPin.length > PIN_MAX || submitting}>
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
