"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateProduk } from "@/hooks/useProduks";
import type { Produk } from "@/services/produkService";
import { formatCurrency, parseCurrency } from "@/lib/utils";

interface EditHargaJualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produk: Produk | null;
  onSuccess?: () => void;
}

export function EditHargaJualDialog({
  open,
  onOpenChange,
  produk,
  onSuccess,
}: EditHargaJualDialogProps) {
  const [hargaRaw, setHargaRaw] = React.useState("");

  const updateProduk = useUpdateProduk();

  React.useEffect(() => {
    if (open && produk) {
      const h = produk.harga_jual;
      setHargaRaw(
        h != null && Number(h) >= 0
          ? formatCurrency(Number(h))
          : ""
      );
    }
  }, [open, produk]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produk?.id) return;
    const num = hargaRaw ? parseFloat(parseCurrency(hargaRaw)) : null;
    const harga_jual = num != null && !isNaN(num) && num >= 0 ? num : null;
    try {
      await updateProduk.mutateAsync({ id: produk.id, harga_jual });
      onSuccess?.();
      onOpenChange(false);
    } catch {
      // Error di-handle di hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Harga Jual</DialogTitle>
          <DialogDescription>
            {produk ? produk.nama_produk : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Harga Jual (Rp)</Label>
            <Input
              type="text"
              placeholder="0"
              value={hargaRaw}
              onChange={(e) => setHargaRaw(parseCurrency(e.target.value))}
              onBlur={() => {
                const n = parseFloat(parseCurrency(hargaRaw));
                if (!isNaN(n) && n >= 0) {
                  setHargaRaw(formatCurrency(n));
                }
              }}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={updateProduk.isPending}>
              {updateProduk.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
