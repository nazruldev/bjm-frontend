"use client";

import * as React from "react";
import { Suspense } from "react";
import { toast } from "sonner";
import { DataTables } from "@/components/datatables/table";
import { useOutlets } from "@/hooks/useOutlets";
import { useTableQuery } from "@/hooks/useTableQuery";
import {
  type CreateOutletDto,
  type Outlet,
  type GetOutletsParams,
} from "@/services/outletService";
import { karyawanService } from "@/services/karyawanService";
import { createFormConfig, type AccessLevelOption } from "./validations/createValidation";
import { createOutletColumns } from "./partials/columns";
import { createOutletFilterConfigs } from "./partials/filters";
import { OutletDeleteDialog } from "./partials/OutletDeleteDialog";
import { useOutletHandlers } from "./partials/handlers";
import { OutletPageSkeleton } from "./partials/skeleton";
import { useTableState } from "@/hooks/useTableState";
import { useAuth } from "@/hooks/useAuth";

function OutletContent() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  // Table state dengan URL sync
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  // Build query params
  const queryParams = useTableQuery<GetOutletsParams>({
    pagination,
    filters,
  });

  // Data fetching
  const { data, isLoading, error } = useOutlets(queryParams);

  // Handlers
  const {
    handleAdd: handleAddOutlet,
    handleDelete: handleDeleteOutlet,
    handleBatchDelete: handleBatchDeleteOutlets,
  } = useOutletHandlers();

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editOutlet, setEditOutlet] = React.useState<Outlet | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [accessLevelOptions, setAccessLevelOptions] = React.useState<AccessLevelOption[]>([]);

  // OWNER tanpa outlet: buka form buat outlet perdana otomatis (setelah redirect dari dashboard)
  React.useEffect(() => {
    if (isOwner && data?.data?.length === 0 && !editOutlet) {
      setFormDialogOpen(true);
    }
  }, [isOwner, data?.data?.length, editOutlet]);

  // Load daftar access level dari Hik saat form dibuka (untuk field defaultAccessLevelList)
  React.useEffect(() => {
    if (!formDialogOpen) return;
    karyawanService
      .getAccessLevelList()
      .then((res) => {
        const arr =
          (res.data as any)?.data?.accessLevelResponse?.accessLevelList ?? [];
        const opts: AccessLevelOption[] = Array.isArray(arr)
          ? arr.map((x: { id: string; name: string }) => ({ value: x.id, label: x.name || x.id }))
          : [];
        setAccessLevelOptions(opts);
      })
      .catch(() => {
        toast.error("Gagal memuat daftar access level (ACS).");
        setAccessLevelOptions([]);
      });
  }, [formDialogOpen]);

  // Event handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleEditClick = (outlet: Outlet) => {
    setEditOutlet(outlet);
    setFormDialogOpen(true);
  };

  const handleAdd = React.useCallback(
    async (formData: CreateOutletDto) => {
      await handleAddOutlet(formData, editOutlet);
      setEditOutlet(null);
      setFormDialogOpen(false);
    },
    [handleAddOutlet, editOutlet]
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteItem) return;
    await handleDeleteOutlet(deleteItem.id);
    setDeleteItem(null);
  }, [deleteItem, handleDeleteOutlet]);

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await handleBatchDeleteOutlets(ids as string[]);
  };

  // Memoized configurations
  const columns = React.useMemo(
    () => createOutletColumns(handleDeleteClick, handleEditClick),
    []
  );

  const formConfig = React.useMemo(
    () => createFormConfig(editOutlet || undefined, accessLevelOptions),
    [editOutlet, accessLevelOptions]
  );

  const filterConfigs = React.useMemo(() => createOutletFilterConfigs(), []);

  const formConfigWithSubmit = React.useMemo(
    () => ({
      ...formConfig,
      onSubmit: handleAdd,
    }),
    [formConfig, handleAdd]
  );

  // Loading & Error states
  if (isLoading) return <OutletPageSkeleton />;
  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data outlet"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Outlet"
        description="Kelola data outlet di sini"
        data={data?.data || []}
        columns={columns}
        formConfig={formConfigWithSubmit}
        onDelete={() => {}}
        onBatchDelete={handleBatchDelete}
        enableRowSelection={true}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={pagination.pageSize}
        pageCount={data?.pagination?.totalPages}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        emptyMessage="Tidak ada outlet ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.nama}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        formDialogOpen={formDialogOpen}
        onFormDialogOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditOutlet(null);
        }}
        onAddClick={() => {
          setEditOutlet(null);
          setFormDialogOpen(true);
        }}
      />

      {deleteItem && (
        <OutletDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          outlet={{ id: deleteItem.id, name: deleteItem.name }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}

export default function OutletPage() {
  return (
    <Suspense fallback={<OutletPageSkeleton />}>
      <OutletContent />
    </Suspense>
  );
}
