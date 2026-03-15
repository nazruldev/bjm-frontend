"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName?: string;
  itemType?: string; // e.g., "outlet", "user", "product"
  isBatch?: boolean;
  count?: number;
}

/**
 * Reusable dialog konfirmasi untuk menghapus item
 * Bisa digunakan untuk single delete atau batch delete
 */
export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  itemType = "item",
  isBatch = false,
  count = 0,
}: DeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
          <AlertDialogDescription>
            {isBatch ? (
              <>
                Tindakan ini akan menghapus <strong>{count} {itemType}</strong> yang
                dipilih. Tindakan ini tidak dapat dibatalkan.
              </>
            ) : (
              <>
                Tindakan ini akan menghapus <strong>{itemName || itemType}</strong>.
                Tindakan ini tidak dapat dibatalkan.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

