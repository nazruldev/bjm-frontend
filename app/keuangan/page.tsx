"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { useKeuangans } from "@/hooks/useKeuangans";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import type { GetKeuangansParams } from "@/services/keuanganService";
import { createKeuanganColumns } from "./partials/columns";
import { createKeuanganFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { useKeuanganHandlers } from "./partials/handlers";
import { useRekenings } from "@/hooks/useRekenings";
import { ReusableFormDialog } from "@/components/datatables/customForm";
import { createFormConfig } from "./validations/createValidation";
import { useConfirmPassword } from "@/components/dialog-confirm-password";

function KeuanganContent() {
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  const transformFilters = React.useCallback((filters: Record<string, any>) => {
    const transformed: Record<string, any> = {};
    if (filters.arus === "MASUK" || filters.arus === "KELUAR") transformed.arus = filters.arus;
    if (filters.search && typeof filters.search === "string") transformed.search = filters.search;
    if (filters.createdAt && typeof filters.createdAt === "object") {
      if (filters.createdAt.from) transformed.dateFrom = filters.createdAt.from;
      if (filters.createdAt.to) transformed.dateTo = filters.createdAt.to;
    }
    return transformed;
  }, []);

  const queryParams = useTableQuery<GetKeuangansParams>({
    pagination,
    filters: transformFilters(filters),
  });

  const { data, isLoading, error } = useKeuangans(queryParams);
  const { data: rekeningData } = useRekenings({ limit: 1000 });
  const {
    handleCreate,
    handleUpdate,
    handleDelete,
    openDeleteDialog,
    closeDeleteDialog,
    deleteDialogOpen,
    selectedId,
    selectedInvoice,
  } = useKeuanganHandlers();

  const { openConfirmPassword } = useConfirmPassword();
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any>(null);

  const handleDeleteClick = React.useCallback((id: string, invoice: string) => openDeleteDialog(id, invoice), [openDeleteDialog]);
  const handleAddClick = React.useCallback(() => { setEditingItem(null); setFormDialogOpen(true); }, []);
  const handleEditClick = React.useCallback((item: any) => { setEditingItem(item); setFormDialogOpen(true); }, []);
  const handleFormSubmit = React.useCallback(
    async (formData: any) => {
      if (editingItem) await handleUpdate(editingItem.id, formData);
      else await handleCreate(formData);
      setFormDialogOpen(false);
      setEditingItem(null);
    },
    [editingItem, handleCreate, handleUpdate]
  );
  const handleFormSubmitWithPassword = React.useCallback(
    (formData: any) =>
      new Promise<void>((resolve, reject) => {
        openConfirmPassword({
          title: "Konfirmasi password",
          description: "Masukkan password Anda untuk menyimpan transaksi keuangan.",
          onConfirm: async () => {
            try {
              await handleFormSubmit(formData);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          onCancel: () => reject(new Error("cancelled")),
        });
      }),
    [openConfirmPassword, handleFormSubmit]
  );
  const handleDeleteConfirm = React.useCallback(async () => { if (selectedId) await handleDelete(selectedId); }, [selectedId, handleDelete]);

  const rekeningOptions = React.useMemo(() => {
    if (!rekeningData?.data) return [];
    return rekeningData.data.filter((r) => r.isActive).map((r) => ({ value: r.id, label: `${r.bank} - ${r.nama} (${r.nomor})` }));
  }, [rekeningData]);

  const columns = React.useMemo(() => createKeuanganColumns(handleDeleteClick), [handleDeleteClick]);
  const filterConfigs = React.useMemo(() => createKeuanganFilterConfigs(), []);
  const formConfig = React.useMemo(
    () => ({
      ...createFormConfig(editingItem, rekeningOptions),
      onSubmit: handleFormSubmitWithPassword,
    }),
    [editingItem, rekeningOptions, handleFormSubmitWithPassword]
  );

  if (isLoading) return <div className="p-4"><div className="text-muted-foreground">Memuat data keuangan...</div></div>;
  if (error) return <div className="p-4"><div className="text-destructive">Error: {error.message || "Gagal memuat data keuangan"}</div></div>;

  return (
    <>
      <DataTables
        title="Keuangan"
        description="Catat uang masuk laci (masuk) atau keluar. Tercatat di Pembayaran."
        data={data?.data || []}
        columns={columns}
        enableRowSelection={false}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={pagination.pageSize}
        pageCount={data?.pagination?.totalPages}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        emptyMessage="Tidak ada transaksi keuangan ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.invoice}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        onAddClick={handleAddClick}
      />
      <ReusableFormDialog open={formDialogOpen} onOpenChange={setFormDialogOpen} config={formConfig} />
      {selectedId && (
        <DeleteDialog open={deleteDialogOpen} onOpenChange={closeDeleteDialog} onConfirm={handleDeleteConfirm} itemName={selectedInvoice} itemType="keuangan" />
      )}
    </>
  );
}

export default function KeuanganPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <KeuanganContent />
    </Suspense>
  );
}
