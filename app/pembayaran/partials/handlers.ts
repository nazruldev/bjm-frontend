"use client";

import { useUpdatePembayaran, useDeletePembayaran } from "@/hooks/usePembayarans";
import type { UpdatePembayaranDto } from "@/services/pembayaranService";

/**
 * Custom hooks untuk pembayaran handlers
 */
export function usePembayaranHandlers() {
  const updatePembayaran = useUpdatePembayaran();
  const deletePembayaran = useDeletePembayaran();

  const handleUpdate = async (id: string, data: UpdatePembayaranDto) => {
    await updatePembayaran.mutateAsync({ id, data });
  };

  const handleDelete = async (id: string) => {
    await deletePembayaran.mutateAsync(id);
  };

  return {
    handleUpdate,
    handleDelete,
    isUpdating: updatePembayaran.isPending,
    isDeleting: deletePembayaran.isPending,
  };
}

