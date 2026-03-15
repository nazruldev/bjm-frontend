"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { usePenggunas } from "@/hooks/usePenggunas";
import { useOutlets } from "@/hooks/useOutlets";
import { useQueryClient } from "@tanstack/react-query";
import { penggunaService } from "@/services/penggunaService";
import { penggunaKeys } from "@/hooks/usePenggunas";
import { toast } from "sonner";
import { useTableState } from "@/hooks/useTableState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useTableQuery } from "@/hooks/useTableQuery";
import {
  type CreatePenggunaDto,
  type Pengguna,
  type GetPenggunasParams,
} from "@/services/penggunaService";
import { createFormConfig, NO_OUTLET_VALUE } from "./validations/createValidation";
import { createPenggunaColumns } from "./partials/columns";
import { createPenggunaFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { usePenggunaHandlers } from "./partials/handlers";

function PenggunaContent() {
  // Table state dengan URL sync
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  // Build query params
  const queryParams = useTableQuery<GetPenggunasParams>({
    pagination,
    filters,
  });

  // Data fetching
  const { data, isLoading, error } = usePenggunas(queryParams);

  // Fetch outlets untuk dropdown
  const { data: outletsData } = useOutlets({ limit: 1000 });
  const outletOptions = React.useMemo(
    () =>
      outletsData?.data.map((outlet) => ({
        value: outlet.id,
        label: outlet.nama,
      })) || [],
    [outletsData]
  );

  // Handlers
  const {
    handleAdd: handleAddPengguna,
    handleDelete: handleDeletePengguna,
    handleBatchDelete: handleBatchDeletePenggunas,
  } = usePenggunaHandlers();
  const queryClient = useQueryClient();

  /** Generate random numeric password (angka saja), min 6 digit untuk validasi backend */
  const generateRandomNumericPassword = (length = 6) => {
    let s = "";
    for (let i = 0; i < length; i++) s += Math.floor(Math.random() * 10);
    return s;
  };

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editPengguna, setEditPengguna] = React.useState<Pengguna | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [resetPasswordResult, setResetPasswordResult] = React.useState<{
    nama: string;
    newPassword: string;
  } | null>(null);

  // Event handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleEditClick = (pengguna: Pengguna) => {
    setEditPengguna(pengguna);
    setFormDialogOpen(true);
  };

  const handleResetPassword = async (pengguna: Pengguna) => {
    const newPassword = generateRandomNumericPassword(6);
    try {
      await penggunaService.updatePengguna({
        id: pengguna.id,
        password: newPassword,
      });
      queryClient.invalidateQueries({ queryKey: penggunaKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: penggunaKeys.detail(pengguna.id),
      });
      setResetPasswordResult({ nama: pengguna.nama, newPassword });
    } catch (err: any) {
      toast.error(err?.message || "Gagal reset password");
    }
  };

  const handleCopyPassword = () => {
    if (!resetPasswordResult) return;
    navigator.clipboard.writeText(resetPasswordResult.newPassword);
    toast.success("Password disalin ke clipboard");
  };

  const handleAdd = React.useCallback(
    async (formData: CreatePenggunaDto) => {
      // Transform outletId: NO_OUTLET_VALUE to null, otherwise keep as is
      const submitData = {
        ...formData,
        outletId: formData.outletId === NO_OUTLET_VALUE ? null : formData.outletId,
      };
      await handleAddPengguna(submitData, editPengguna);
      setEditPengguna(null);
      setFormDialogOpen(false);
    },
    [handleAddPengguna, editPengguna]
  );

  const handleDelete = async () => {
    if (deleteItem) {
      await handleDeletePengguna(deleteItem.id);
      setDeleteItem(null);
    }
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await handleBatchDeletePenggunas(ids as string[]);
  };

  // Memoized configurations
  const columns = React.useMemo(
    () =>
      createPenggunaColumns(
        handleDeleteClick,
        handleEditClick,
        handleResetPassword
      ),
    []
  );

  const formConfig = React.useMemo(
    () => createFormConfig(editPengguna || undefined, outletOptions),
    [editPengguna, outletOptions]
  );

  const filterConfigs = React.useMemo(() => createPenggunaFilterConfigs(), []);

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
        <div className="text-muted-foreground">Memuat data pengguna...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data pengguna"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Pengguna"
        description="Kelola data pengguna di sini"
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
        emptyMessage="Tidak ada pengguna ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.nama}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        formDialogOpen={formDialogOpen}
        onFormDialogOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditPengguna(null);
        }}
        onAddClick={() => {
          setEditPengguna(null);
          setFormDialogOpen(true);
        }}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          itemName={deleteItem.name}
          itemType="pengguna"
        />
      )}

      <Dialog
        open={!!resetPasswordResult}
        onOpenChange={(open) => !open && setResetPasswordResult(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password Berhasil Direset</DialogTitle>
            <DialogDescription>
              Password untuk <strong>{resetPasswordResult?.nama}</strong> telah
              direset. Beri tahu pengguna untuk login dengan password baru dan
              ganti setelah login.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground mb-1.5">
              Password baru:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border bg-muted px-4 py-3 text-xl font-mono font-semibold tracking-widest">
                {resetPasswordResult?.newPassword}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyPassword}
                title="Salin password"
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setResetPasswordResult(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PenggunaPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <PenggunaContent />
    </Suspense>
  );
}