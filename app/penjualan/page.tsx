"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { usePenjualans } from "@/hooks/usePenjualans";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import type { GetPenjualansParams } from "@/services/penjualanService";
import { createPenjualanColumns } from "./partials/columns";
import { createPenjualanFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { usePenjualanHandlers } from "./partials/handlers";
import { PengirimanFormDialog } from "@/app/pengiriman/partials/pengirimanFormDialog";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function PenjualanContent() {
  const router = useRouter();
  const { user } = useAuth();
  const canDeletePenjualan = user?.role === "OWNER";
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  const transformFilters = React.useCallback((filters: Record<string, any>) => {
    const transformed: Record<string, any> = {};
    if (filters.search && typeof filters.search === "string") {
      transformed.search = filters.search;
    }
    if (filters.createdAt && typeof filters.createdAt === "object") {
      if (filters.createdAt.from) transformed.dateFrom = filters.createdAt.from;
      if (filters.createdAt.to) transformed.dateTo = filters.createdAt.to;
    }
    return transformed;
  }, []);

  const queryParams = useTableQuery<GetPenjualansParams>({
    pagination,
    filters: transformFilters(filters),
  });

  const { data, isLoading, error } = usePenjualans(queryParams);
  const { data: penjualanListForPengiriman } = usePenjualans({ limit: 200 });
  const penjualanWithoutPengiriman = React.useMemo(() => {
    const list = penjualanListForPengiriman?.data ?? [];
    return list.filter((p) => !p.pengiriman);
  }, [penjualanListForPengiriman]);

  const { handleDelete } = usePenjualanHandlers();

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [addPengirimanOpen, setAddPengirimanOpen] = React.useState(false);
  const [addPengirimanPenjualanId, setAddPengirimanPenjualanId] = React.useState<string | null>(null);

  const handleDeleteClick = React.useCallback((id: string, invoice: string) => {
    setDeleteItem({ id, name: invoice });
    setDeleteOpen(true);
  }, []);

  const handleViewDetail = React.useCallback(
    (id: string) => router.push(`/penjualan/${id}`),
    [router]
  );

  const handleAddPengiriman = React.useCallback((penjualanId: string) => {
    setAddPengirimanPenjualanId(penjualanId);
    setAddPengirimanOpen(true);
  }, []);

  const handleAddPengirimanClose = React.useCallback((open: boolean) => {
    setAddPengirimanOpen(open);
    if (!open) setAddPengirimanPenjualanId(null);
  }, []);

  const handleConfirmDelete = React.useCallback(async () => {
    if (deleteItem) {
      try {
        await handleDelete(deleteItem.id);
        setDeleteItem(null);
        setDeleteOpen(false);
      } catch {
        // Error di-handle di handler
      }
    }
  }, [deleteItem, handleDelete]);

  const handleDeleteDialogClose = React.useCallback((open: boolean) => {
    setDeleteOpen(open);
    if (!open) setDeleteItem(null);
  }, []);

  const columns = React.useMemo(
    () => createPenjualanColumns(handleViewDetail, handleDeleteClick, canDeletePenjualan, handleAddPengiriman),
    [handleViewDetail, handleDeleteClick, canDeletePenjualan, handleAddPengiriman]
  );

  const filterConfigs = React.useMemo(() => createPenjualanFilterConfigs(), []);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data penjualan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data penjualan"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Penjualan"
        description="Kelola data penjualan"
        data={data?.data || []}
        columns={columns}
        enableRowSelection={false}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={pagination.pageSize}
        pageCount={data?.pagination?.totalPages}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        emptyMessage="Tidak ada penjualan ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.invoice}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        onAddClick={() => router.push("/penjualan/pos")}
      />

      <PengirimanFormDialog
        open={addPengirimanOpen}
        onOpenChange={handleAddPengirimanClose}
        penjualanOptions={penjualanWithoutPengiriman}
        initialPenjualanId={addPengirimanPenjualanId}
        onSuccess={() => handleAddPengirimanClose(false)}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={handleDeleteDialogClose}
          onConfirm={handleConfirmDelete}
          itemName={deleteItem.name}
          itemType="penjualan"
        />
      )}
    </>
  );
}

export default function PenjualanPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <PenjualanContent />
    </Suspense>
  );
}
