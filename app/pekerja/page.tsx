"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { usePekerjas } from "@/hooks/usePekerjas";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import { useTarifPekerjaList } from "@/hooks/useTarifPekerja";
import { type CreatePekerjaDto, type Pekerja, type GetPekerjasParams } from "@/services/pekerjaService";
import { createFormConfig } from "./validations/createValidation";
import { createPekerjaColumns } from "./partials/columns";
import { createPekerjaFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { usePekerjaHandlers } from "./partials/handlers";

function PekerjaContent() {
  // Table state dengan URL sync
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  // Build query params
  const queryParams = useTableQuery<GetPekerjasParams>({
    pagination,
    filters,
  });

  // Data fetching
  const { data, isLoading, error } = usePekerjas(queryParams);
  const { data: tarifData } = useTarifPekerjaList();

  // Handlers
  const {
    handleAdd: handleAddPekerja,
    handleDelete: handleDeletePekerja,
    handleBatchDelete: handleBatchDeletePekerjas,
  } = usePekerjaHandlers();

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editPekerja, setEditPekerja] = React.useState<Pekerja | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);

  // Event handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleEditClick = (pekerja: Pekerja) => {
    setEditPekerja(pekerja);
    setFormDialogOpen(true);
  };

  const handleAdd = React.useCallback(
    async (formData: CreatePekerjaDto) => {
      await handleAddPekerja(formData, editPekerja);
      setEditPekerja(null);
      setFormDialogOpen(false);
    },
    [handleAddPekerja, editPekerja]
  );

  const handleDelete = async () => {
    if (deleteItem) {
      await handleDeletePekerja(deleteItem.id);
      setDeleteItem(null);
    }
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await handleBatchDeletePekerjas(ids as string[]);
  };

  // Memoized configurations
  const columns = React.useMemo(
    () => createPekerjaColumns(handleDeleteClick, handleEditClick),
    []
  );

  const formConfig = React.useMemo(
    () => createFormConfig(editPekerja || undefined, tarifData?.data ?? []),
    [editPekerja, tarifData?.data]
  );

  const filterConfigs = React.useMemo(() => createPekerjaFilterConfigs(), []);

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
        <div className="text-muted-foreground">Memuat data pekerja...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data pekerja"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Pekerja"
        description="Kelola data pekerja di sini"
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
        emptyMessage="Tidak ada pekerja ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.nama}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        formDialogOpen={formDialogOpen}
        onFormDialogOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditPekerja(null);
        }}
        onAddClick={() => {
          setEditPekerja(null);
          setFormDialogOpen(true);
        }}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          itemName={deleteItem.name}
          itemType="pekerja"
        />
      )}
    </>
  );
}

export default function PekerjaPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <PekerjaContent />
    </Suspense>
  );
}
