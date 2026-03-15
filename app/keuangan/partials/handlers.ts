"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateKeuangan, useUpdateKeuangan, useDeleteKeuangan } from "@/hooks/useKeuangans";
import type { CreateKeuanganDto, UpdateKeuanganDto } from "@/services/keuanganService";
import { parseCurrency, toLocalDateStringOnly } from "@/lib/utils";

const NO_OUTLET_VALUE = "__no_outlet__";

export function useKeuanganHandlers() {
  const router = useRouter();
  const createMutation = useCreateKeuangan();
  const updateMutation = useUpdateKeuangan();
  const deleteMutation = useDeleteKeuangan();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string>("");

  const handleCreate = async (formData: any) => {
    const rawDate = formData.createdAt;
    const dateStr =
      typeof rawDate === "string" && rawDate.trim()
        ? rawDate.trim().slice(0, 10)
        : rawDate instanceof Date && !isNaN(rawDate.getTime())
          ? toLocalDateStringOnly(rawDate)
          : undefined;
    const createdAt = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : undefined;

    const payload: CreateKeuanganDto = {
      invoice: formData.invoice || undefined,
      arus: formData.arus === "MASUK" || formData.arus === "KELUAR" ? formData.arus : "KELUAR",
      total: typeof formData.total === "string" ? parseFloat(parseCurrency(formData.total)) : formData.total,
      catatan: formData.catatan || null,
      isCashless: formData.isCashless || false,
      rekeningId: formData.isCashless && formData.rekeningId && formData.rekeningId !== "" && formData.rekeningId !== NO_OUTLET_VALUE ? formData.rekeningId : null,
      createdAt,
    };
    await createMutation.mutateAsync(payload);
  };

  const handleUpdate = async (id: string, formData: any) => {
    const payload: UpdateKeuanganDto = {
      arus: formData.arus === "MASUK" || formData.arus === "KELUAR" ? formData.arus : undefined,
      total: formData.total !== undefined ? (typeof formData.total === "string" ? parseFloat(parseCurrency(formData.total)) : formData.total) : undefined,
      catatan: formData.catatan !== undefined ? formData.catatan : undefined,
    };
    await updateMutation.mutateAsync({ id, data: payload });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setDeleteDialogOpen(false);
    setSelectedId(null);
    setSelectedInvoice("");
  };

  const openDeleteDialog = (id: string, invoice: string) => {
    setSelectedId(id);
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedId(null);
    setSelectedInvoice("");
  };

  const handleViewDetail = (id: string) => router.push(`/keuangan/${id}`);

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    handleViewDetail,
    openDeleteDialog,
    closeDeleteDialog,
    deleteDialogOpen,
    selectedId,
    selectedInvoice,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
