"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { usePemasoks } from "@/hooks/usePemasoks";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import {
  type CreatePemasokDto,
  type Pemasok,
  type GetPemasoksParams,
} from "@/services/pemasokService";
import { createFormConfig } from "./validations/createValidation";
import { createPemasokColumns } from "./partials/columns";
import { createPemasokFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { usePemasokHandlers } from "./partials/handlers";

function PemasokContent() {
  // Table state dengan URL sync
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  // Build query params
  const queryParams = useTableQuery<GetPemasoksParams>({
    pagination,
    filters,
  });

  // Data fetching
  const { data, isLoading, error } = usePemasoks(queryParams);

  // Handlers
  const {
    handleAdd: handleAddPemasok,
    handleDelete: handleDeletePemasok,
    handleBatchDelete: handleBatchDeletePemasoks,
  } = usePemasokHandlers();

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editPemasok, setEditPemasok] = React.useState<Pemasok | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);

  // Event handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleEditClick = (pemasok: Pemasok) => {
    setEditPemasok(pemasok);
    setFormDialogOpen(true);
  };

  const handleAdd = React.useCallback(
    async (formData: CreatePemasokDto) => {
      await handleAddPemasok(formData, editPemasok);
      setEditPemasok(null);
      setFormDialogOpen(false);
    },
    [handleAddPemasok, editPemasok]
  );

  const handleDelete = async () => {
    if (deleteItem) {
      await handleDeletePemasok(deleteItem.id);
      setDeleteItem(null);
    }
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await handleBatchDeletePemasoks(ids as string[]);
  };

  // Memoized configurations
  const columns = React.useMemo(
    () => createPemasokColumns(handleDeleteClick, handleEditClick),
    []
  );

  const formConfig = React.useMemo(
    () => createFormConfig(editPemasok || undefined),
    [editPemasok]
  );

  const filterConfigs = React.useMemo(() => createPemasokFilterConfigs(), []);

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
        <div className="text-muted-foreground">Memuat data pemasok...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data pemasok"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Pemasok"
        description="Kelola data pemasok di sini"
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
        emptyMessage="Tidak ada pemasok ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.nama}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        formDialogOpen={formDialogOpen}
        onFormDialogOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditPemasok(null);
        }}
        onAddClick={() => {
          setEditPemasok(null);
          setFormDialogOpen(true);
        }}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          itemName={deleteItem.name}
          itemType="pemasok"
        />
      )}
    </>
  );
}

export default function PemasokPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <PemasokContent />
    </Suspense>
  );
}
