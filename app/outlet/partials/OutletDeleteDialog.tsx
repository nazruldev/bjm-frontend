"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OutletDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outlet: { id: string; name: string } | null;
  onConfirm: () => Promise<void>;
}

const CONFIRM_PLACEHOLDER = "Ketik nama outlet untuk konfirmasi";

/**
 * Dialog hapus outlet: wajib ketik nama outlet, tombol Hapus menunggu selesai baru tutup.
 * Semua data terkait outlet ikut terhapus permanen.
 */
export function OutletDeleteDialog({
  open,
  onOpenChange,
  outlet,
  onConfirm,
}: OutletDeleteDialogProps) {
  const [confirmText, setConfirmText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const isValid = outlet?.name && confirmText.trim() === outlet.name.trim();

  React.useEffect(() => {
    if (!open) {
      setConfirmText("");
      setSubmitting(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!outlet || !isValid || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Outlet</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Tindakan ini akan <strong>menghapus permanen</strong> outlet &quot;{outlet?.name}&quot; dan
                semua data terkait (karyawan, pekerja, gaji, rekening, pembayaran, dll). Karyawan akan
                dihapus dari Hik terlebih dulu. Pengguna OWNER tidak dihapus (hanya lepas dari outlet).
                Tindakan tidak dapat dibatalkan.
              </p>
              <p className="font-medium text-foreground">
                Ketik nama outlet di bawah untuk konfirmasi:
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="confirm-outlet-name">{CONFIRM_PLACEHOLDER}</Label>
            <Input
              id="confirm-outlet-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={outlet?.name ?? ""}
              disabled={submitting}
              className="font-mono"
              autoComplete="off"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || submitting}
          >
            {submitting ? "Menghapus..." : "Hapus Outlet"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
