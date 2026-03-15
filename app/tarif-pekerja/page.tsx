"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { useTarifPekerjaList } from "@/hooks/useTarifPekerja";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import type {
  TarifPekerjaItem,
  CreateTarifPekerjaDto,
} from "@/services/tarifPekerjaService";
import type { GetTarifPekerjaParams } from "@/hooks/useTarifPekerja";
import { createTarifPekerjaColumns } from "./partials/columns";
import { createTarifPekerjaFilterConfigs } from "./partials/filters";
import { createFormConfig } from "./validations/createValidation";
import { useTarifPekerjaHandlers } from "./partials/handlers";
import { DeleteDialog } from "@/components/delete-dialog";

function TarifPekerjaContent() {
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  const queryParams = useTableQuery<GetTarifPekerjaParams>({
    pagination,
    filters,
  });

  const { data, isLoading, error } = useTarifPekerjaList(queryParams);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editItem, setEditItem] = React.useState<TarifPekerjaItem | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);

  const {
    handleAdd,
    handleDelete: handleDeleteTarif,
    handleBatchDelete,
  } = useTarifPekerjaHandlers();

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleEditClick = (row: TarifPekerjaItem) => {
    setEditItem(row);
    setFormDialogOpen(true);
  };

  const handleAddSubmit = React.useCallback(
    async (formData: CreateTarifPekerjaDto) => {
      await handleAdd(formData, editItem);
      setEditItem(null);
      setFormDialogOpen(false);
      handleFilterReset();
    },
    [handleAdd, editItem, handleFilterReset]
  );

  const handleConfirmDelete = async () => {
    if (deleteItem) {
      await handleDeleteTarif(deleteItem.id);
      setDeleteItem(null);
    }
  };

  const handleBatchDeleteIds = async (ids: (number | string)[]) => {
    await handleBatchDelete(ids);
  };

  const columns = React.useMemo(
    () => createTarifPekerjaColumns(handleDeleteClick, handleEditClick),
    []
  );

  const formConfig = React.useMemo(
    () => createFormConfig(editItem ?? undefined),
    [editItem]
  );

  const formConfigWithSubmit = React.useMemo(
    () => ({
      ...formConfig,
      onSubmit: handleAddSubmit,
    }),
    [formConfig, handleAddSubmit]
  );

  const filterConfigs = React.useMemo(
    () => createTarifPekerjaFilterConfigs(),
    []
  );

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data tarif...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data tarif"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Tarif Pekerja"
        description="Daftar tarif upah per kg. Pekerja memilih tarif di Master → Pekerja."
        data={data?.data ?? []}
        columns={columns}
        formConfig={formConfigWithSubmit}
        onDelete={handleConfirmDelete}
        onBatchDelete={handleBatchDeleteIds}
        enableRowSelection={true}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={pagination.pageSize}
        pageCount={data?.pagination?.totalPages}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        emptyMessage="Tidak ada tarif ditemukan"
        getRowId={(row) => row.id}
        getNameFromRow={(row) =>
          row.nama || (row.tipe === "PENJEMUR" ? "Penjemur" : "Pengupas")
        }
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        formDialogOpen={formDialogOpen}
        onFormDialogOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditItem(null);
        }}
        onAddClick={() => {
          setEditItem(null);
          setFormDialogOpen(true);
        }}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleConfirmDelete}
          itemName={deleteItem.name}
          itemType="tarif"
        />
      )}
    </>
  );
}

export default function TarifPekerjaPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <TarifPekerjaContent />
    </Suspense>
  );
}
