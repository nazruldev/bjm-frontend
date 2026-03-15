"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { useRekenings } from "@/hooks/useRekenings";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import {
  type CreateRekeningDto,
  type Rekening,
  type GetRekeningsParams,
} from "@/services/rekeningService";
import { createFormConfig } from "./validations/createValidation";
import { createRekeningColumns } from "./partials/columns";
import { createRekeningFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { useRekeningHandlers } from "./partials/handlers";

function RekeningContent() {
  // Table state dengan URL sync
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  // Build query params
  const queryParams = useTableQuery<GetRekeningsParams>({
    pagination,
    filters,
  });

  // Data fetching
  const { data, isLoading, error } = useRekenings(queryParams);

  // Handlers
  const {
    handleAdd: handleAddRekening,
    handleDelete: handleDeleteRekening,
    handleBatchDelete: handleBatchDeleteRekenings,
  } = useRekeningHandlers();

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editRekening, setEditRekening] = React.useState<Rekening | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);

  // Event handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleEditClick = (rekening: Rekening) => {
    setEditRekening(rekening);
    setFormDialogOpen(true);
  };

  const handleAdd = React.useCallback(
    async (formData: CreateRekeningDto) => {
      await handleAddRekening(formData, editRekening);
      setEditRekening(null);
      setFormDialogOpen(false);
    },
    [handleAddRekening, editRekening]
  );

  const handleDelete = async () => {
    if (deleteItem) {
      await handleDeleteRekening(deleteItem.id);
      setDeleteItem(null);
    }
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await handleBatchDeleteRekenings(ids as string[]);
  };

  // Memoized configurations
  const columns = React.useMemo(
    () => createRekeningColumns(handleDeleteClick, handleEditClick),
    []
  );

  const formConfig = React.useMemo(
    () => createFormConfig(editRekening || undefined),
    [editRekening]
  );

  const filterConfigs = React.useMemo(() => createRekeningFilterConfigs(), []);

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
        <div className="text-muted-foreground">Memuat data rekening...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data rekening"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Rekening"
        description="Kelola data rekening di sini"
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
        emptyMessage="Tidak ada rekening ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.nama}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        formDialogOpen={formDialogOpen}
        onFormDialogOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditRekening(null);
        }}
        onAddClick={() => {
          setEditRekening(null);
          setFormDialogOpen(true);
        }}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          itemName={deleteItem.name}
          itemType="rekening"
        />
      )}
    </>
  );
}

export default function RekeningPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <RekeningContent />
    </Suspense>
  );
}