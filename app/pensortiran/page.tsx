"use client";

import * as React from "react";
import { Suspense } from "react";
import { toast } from "sonner";
import { DataTables } from "@/components/datatables/table";
import { usePensortirans, useConfirmPensortiran } from "@/hooks/usePensortirans";
import { usePenggunas } from "@/hooks/usePenggunas";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import {
  type CreatePensortiranDto,
  type Pensortiran,
  type GetPensortiransParams,
} from "@/services/pensortiranService";
import { createPensortiranColumns } from "./partials/columns";
import { createPensortiranFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { usePensortiranHandlers } from "./partials/handlers";
import { PensortiranForm } from "./partials/pensortiranForm";
import { ConfirmDialog } from "./partials/confirmDialog";
import type { ConfirmPensortiranDto } from "@/services/pensortiranService";
import { useRouter } from "next/navigation";

function PensortiranContent() {
  const router = useRouter();
  
  // Table state dengan URL sync
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  // Transform filters to backend format
  const transformFilters = React.useCallback((filters: Record<string, any>) => {
    const transformed: Record<string, any> = {};

    // Inspector ID
    if (
      filters.inspectorId &&
      typeof filters.inspectorId === "string" &&
      filters.inspectorId !== "__all__"
    ) {
      transformed.inspectorId = filters.inspectorId;
    }

    // Status
    if (filters.status && typeof filters.status === "string" && filters.status !== "__all__") {
      transformed.status = filters.status;
    }

    // Search by invoice
    if (filters.search && typeof filters.search === "string") {
      transformed.search = filters.search;
    }

    // Date range
    if (filters.tanggal && typeof filters.tanggal === "object") {
      if (filters.tanggal.from) {
        transformed.dateFrom = filters.tanggal.from;
      }
      if (filters.tanggal.to) {
        transformed.dateTo = filters.tanggal.to;
      }
    }

    return transformed;
  }, []);

  // Build query params
  const queryParams = useTableQuery<GetPensortiransParams>({
    pagination,
    filters: transformFilters(filters),
  });

  // Data fetching
  const { data, isLoading, error } = usePensortirans(queryParams);

  // Fetch inspector (pengguna dengan role INSPECTOR) untuk dropdown
  const { data: penggunaData } = usePenggunas({ limit: 1000, role: "INSPECTOR" });

  // Handlers
  const {
    handleAdd: handleAddPensortiran,
    handleDelete: handleDeletePensortiran,
  } = usePensortiranHandlers();

  // Hook untuk konfirmasi
  const confirmPensortiran = useConfirmPensortiran();

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [confirmPensortiranData, setConfirmPensortiranData] = React.useState<Pensortiran | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);

  // Event handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleAdd = React.useCallback(
    async (formData: CreatePensortiranDto) => {
      await handleAddPensortiran(formData);
      setFormDialogOpen(false);
    },
    [handleAddPensortiran]
  );

  const handleDelete = async () => {
    if (deleteItem) {
      await handleDeletePensortiran(deleteItem.id);
      setDeleteItem(null);
    }
  };

  const handleConfirmClick = (pensortiran: Pensortiran) => {
    setConfirmPensortiranData(pensortiran);
    setConfirmDialogOpen(true);
  };

  const handleViewDetail = (id: string) => {
    router.push(`/pensortiran/${id}`);
  };

  const handleConfirm = React.useCallback(
    async (formData: ConfirmPensortiranDto) => {
      if (confirmPensortiranData) {
        await confirmPensortiran.mutateAsync({
          id: confirmPensortiranData.id,
          data: formData,
        });
        setConfirmPensortiranData(null);
        setConfirmDialogOpen(false);
      }
    },
    [confirmPensortiran, confirmPensortiranData]
  );

  // Inspector options untuk dropdown
  const inspectorOptions = React.useMemo(() => {
    if (!penggunaData?.data) return [];
    return penggunaData.data.map((pengguna) => ({
      value: pengguna.id,
      label: pengguna.nama,
    }));
  }, [penggunaData]);

  // Memoized configurations
  const columns = React.useMemo(
    () => createPensortiranColumns(handleDeleteClick, handleConfirmClick, handleViewDetail),
    [handleConfirmClick, handleViewDetail]
  );

  const filterConfigs = React.useMemo(
    () => createPensortiranFilterConfigs(inspectorOptions),
    [inspectorOptions]
  );

  // Loading & Error states
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data pensortiran...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data pensortiran"}
        </div>
      </div>
    );
  }

  return (
    <>
      <PensortiranForm
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        inspectorOptions={inspectorOptions}
        onSubmit={handleAdd}
      />
      <DataTables
        title="Pensortiran"
        description="Kelola data pensortiran di sini"
        data={data?.data || []}
        columns={columns}
        onDelete={handleDelete}
        enableRowSelection={false}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={pagination.pageSize}
        pageCount={data?.pagination?.totalPages}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        emptyMessage="Tidak ada pensortiran ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.invoice || `Pensortiran ${row.id}`}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        formDialogOpen={formDialogOpen}
        onFormDialogOpenChange={setFormDialogOpen}
        onAddClick={() => {
          setFormDialogOpen(true);
        }}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          itemName={deleteItem.name}
          itemType="pensortiran"
        />
      )}

      {confirmPensortiranData && (
        <ConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={(open) => {
            setConfirmDialogOpen(open);
            if (!open) setConfirmPensortiranData(null);
          }}
          pensortiran={confirmPensortiranData}
          onSubmit={handleConfirm}
        />
      )}
    </>
  );
}

export default function PensortiranPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat data pensortiran...</div>}>
      <PensortiranContent />
    </Suspense>
  );
}
