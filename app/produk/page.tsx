"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { useProduks } from "@/hooks/useProduks";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import {
  type CreateProdukDto,
  type Produk,
  type GetProduksParams,
} from "@/services/produkService";
import { createFormConfig } from "./validations/createValidation";
import { createProdukColumns } from "./partials/columns";
import { createProdukFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { useProdukHandlers } from "./partials/handlers";

function ProdukContent() {
  // Table state dengan URL sync
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  // Build query params
  const queryParams = useTableQuery<GetProduksParams>({
    pagination,
    filters,
  });

  // Data fetching - pastikan backend mengembalikan proses
  const { data, isLoading, error } = useProduks(queryParams);

  // Handlers
  const {
    handleAdd: handleAddProduk,
    handleDelete: handleDeleteProduk,
    handleBatchDelete: handleBatchDeleteProduks,
  } = useProdukHandlers();

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editProduk, setEditProduk] = React.useState<Produk | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);

  // Event handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleEditClick = (produk: Produk) => {
    setEditProduk(produk);
    setFormDialogOpen(true);
  };

  const handleAdd = React.useCallback(
    async (formData: CreateProdukDto) => {
      await handleAddProduk(formData, editProduk);
      setEditProduk(null);
      setFormDialogOpen(false);
    },
    [handleAddProduk, editProduk]
  );

  const handleDelete = async () => {
    if (deleteItem) {
      await handleDeleteProduk(deleteItem.id);
      setDeleteItem(null);
    }
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await handleBatchDeleteProduks(ids as string[]);
  };

  // Memoized configurations
  const columns = React.useMemo(
    () => createProdukColumns(handleDeleteClick, handleEditClick),
    [handleDeleteClick, handleEditClick]
  );

  const formConfig = React.useMemo(
    () => createFormConfig(editProduk || undefined),
    [editProduk]
  );

  const filterConfigs = React.useMemo(() => createProdukFilterConfigs(), []);

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
        <div className="text-muted-foreground">Memuat data produk...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data produk"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Produk"
        description="Kelola data produk di sini"
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
        emptyMessage="Tidak ada produk ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.nama_produk}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        formDialogOpen={formDialogOpen}
        onFormDialogOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditProduk(null);
        }}
        onAddClick={() => {
          setEditProduk(null);
          setFormDialogOpen(true);
        }}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          itemName={deleteItem.name}
          itemType="produk"
        />
      )}
    </>
  );
}

export default function ProdukPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <ProdukContent />
    </Suspense>
  );
}
