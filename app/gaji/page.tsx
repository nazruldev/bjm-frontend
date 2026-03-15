"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { useGajis } from "@/hooks/useGajis";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import {
  type CreateGajiDto,
  type Gaji,
  type GetGajisParams,
} from "@/services/gajiService";
import { createFormConfig } from "./validations/createValidation";
import { createGajiColumns } from "./partials/columns";
import { createGajiFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { useGajiHandlers } from "./partials/handlers";

function GajiContent() {
  // Table state dengan URL sync
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  // Build query params
  const queryParams = useTableQuery<GetGajisParams>({
    pagination,
    filters,
  });

  // Data fetching
  const { data, isLoading, error } = useGajis(queryParams);

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: number;
    name: string;
  } | null>(null);
  const [editGaji, setEditGaji] = React.useState<Gaji | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);

  // Handlers
  const {
    handleAdd: handleAddGaji,
    handleDelete: handleDeleteGaji,
    handleBatchDelete: handleBatchDeleteGajis,
  } = useGajiHandlers();

  // Event handlers
  const handleDeleteClick = (id: number, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleEditClick = (gaji: Gaji) => {
    setEditGaji(gaji);
    setFormDialogOpen(true);
  };

  const handleAdd = React.useCallback(
    async (formData: CreateGajiDto) => {
      await handleAddGaji(formData, editGaji);
      setEditGaji(null);
      setFormDialogOpen(false);
    },
    [handleAddGaji, editGaji]
  );

  const handleDelete = async () => {
    if (deleteItem) {
      await handleDeleteGaji(deleteItem.id);
      setDeleteItem(null);
    }
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await handleBatchDeleteGajis(ids);
  };

  // Memoized configurations
  const columns = React.useMemo(
    () => createGajiColumns(handleDeleteClick, handleEditClick),
    []
  );

  const formConfig = React.useMemo(
    () => createFormConfig(editGaji || undefined),
    [editGaji]
  );

  const filterConfigs = React.useMemo(() => createGajiFilterConfigs(), []);

  const formConfigWithSubmit = React.useMemo(
    () => ({
      ...formConfig,
      onSubmit: handleAdd,
    }),
    [formConfig, handleAdd]
  );

  // Loading & Error states
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data gaji...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data gaji"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Tarif Gaji Karyawan"
        description="Kelola data gaji di sini"
        data={data?.data || []}
        columns={columns}
        formConfig={formConfigWithSubmit}
        onDelete={handleDelete}
        onBatchDelete={handleBatchDelete}
        enableRowSelection={true}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={pagination.pageSize}
        pageCount={data?.pagination?.totalPages}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        emptyMessage="Tidak ada gaji ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.nama}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        formDialogOpen={formDialogOpen}
        onFormDialogOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditGaji(null);
        }}
        onAddClick={() => {
          setEditGaji(null);
          setFormDialogOpen(true);
        }}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          itemName={deleteItem.name}
          itemType="gaji"
        />
      )}
    </>
  );
}

export default function GajiPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <GajiContent />
    </Suspense>
  );
}

