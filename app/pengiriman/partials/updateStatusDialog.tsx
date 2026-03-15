"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdatePengiriman } from "@/hooks/usePengiriman";
import type { Pengiriman } from "@/services/pengirimanService";

const STATUS_OPTIONS = [
  { value: "MENUNGGU", label: "Menunggu" },
  { value: "DALAM_PENGIRIMAN", label: "Dalam Pengiriman" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DIBATALKAN", label: "Dibatalkan" },
];

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pengiriman: Pengiriman | null;
  onSuccess?: () => void;
}

export function UpdateStatusDialog({
  open,
  onOpenChange,
  pengiriman,
  onSuccess,
}: UpdateStatusDialogProps) {
  const [status, setStatus] = React.useState(pengiriman?.status ?? "MENUNGGU");
  const updatePengiriman = useUpdatePengiriman();

  React.useEffect(() => {
    if (open && pengiriman) setStatus(pengiriman.status);
  }, [open, pengiriman]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pengiriman?.id) return;
    try {
      await updatePengiriman.mutateAsync({ id: pengiriman.id, data: { status } });
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
          <DialogTitle>Update Status Pengiriman</DialogTitle>
          <DialogDescription>
            {pengiriman?.penjualan?.invoice
              ? `Invoice: ${pengiriman.penjualan.invoice}`
              : "Ubah status pengiriman"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={updatePengiriman.isPending}>
              {updatePengiriman.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
