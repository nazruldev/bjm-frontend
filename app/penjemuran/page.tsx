"use client";

import * as React from "react";
import { Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DataTables } from "@/components/datatables/table";
import { usePenjemurans, useConfirmPenjemuran } from "@/hooks/usePenjemurans";
import { usePekerjas } from "@/hooks/usePekerjas";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import { useAuth } from "@/hooks/useAuth";
import { mutasiStokKeys } from "@/hooks/useMutasiStoks";
import {
  type CreatePenjemuranDto,
  type Penjemuran,
  type GetPenjemuransParams,
} from "@/services/penjemuranService";
import { createPenjemuranColumns } from "./partials/columns";
import { createPenjemuranFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { usePenjemuranHandlers } from "./partials/handlers";
import { PenjemuranForm } from "./partials/penjemuranForm";
import { ConfirmDialog } from "./partials/confirmDialog";
import type { ConfirmPenjemuranDto } from "@/services/penjemuranService";
import { useRouter } from "next/navigation";

function PenjemuranContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isInspector = user?.role === "INSPECTOR";

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

    // Pekerja ID
    if (
      filters.pekerjaId &&
      typeof filters.pekerjaId === "string" &&
      filters.pekerjaId !== "__all__"
    ) {
      transformed.pekerjaId = filters.pekerjaId;
    }

    // Search by invoice
    if (filters.search && typeof filters.search === "string") {
      transformed.search = filters.search;
    }

    // Date range - transform object to dateFrom, dateTo
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
  const queryParams = useTableQuery<GetPenjemuransParams>({
    pagination,
    filters: transformFilters(filters),
  });

  // Data fetching
  const { data, isLoading, error } = usePenjemurans(queryParams);

  // Fetch pekerja untuk dropdown
  const { data: pekerjaData } = usePekerjas({ limit: 1000, type: "PENJEMUR" });

  // Handlers
  const {
    handleAdd: handleAddPenjemuran,
    handleDelete: handleDeletePenjemuran,
  } = usePenjemuranHandlers();

  // Hook untuk konfirmasi
  const confirmPenjemuran = useConfirmPenjemuran();

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [confirmPenjemuranData, setConfirmPenjemuranData] = React.useState<Penjemuran | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);

  // Refetch stok mutasi saat form tambah dibuka agar stok terbaru (setelah pembelian) tampil
  React.useEffect(() => {
    if (formDialogOpen) {
      queryClient.invalidateQueries({ queryKey: mutasiStokKeys.all });
    }
  }, [formDialogOpen, queryClient]);

  // Event handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleAdd = React.useCallback(
    async (formData: CreatePenjemuranDto) => {
      await handleAddPenjemuran(formData);
      setFormDialogOpen(false);
    },
    [handleAddPenjemuran]
  );

  const handleDelete = async () => {
    if (deleteItem) {
      await handleDeletePenjemuran(deleteItem.id);
      setDeleteItem(null);
    }
  };

  const handleConfirmClick = (penjemuran: Penjemuran) => {
    setConfirmPenjemuranData(penjemuran);
    setConfirmDialogOpen(true);
  };

  const handleViewDetail = (id: string) => {
    router.push(`/penjemuran/${id}`);
  };

  const handleConfirm = React.useCallback(
    async (formData: ConfirmPenjemuranDto) => {
      if (confirmPenjemuranData) {
        const id = confirmPenjemuranData.id;
        await confirmPenjemuran.mutateAsync({
          id,
          data: formData,
        });
        setConfirmPenjemuranData(null);
        setConfirmDialogOpen(false);
        router.push(`/penjemuran/${id}`);
      }
    },
    [confirmPenjemuran, confirmPenjemuranData]
  );

  // Pekerja options untuk dropdown (dengan tarif dari master tarifPekerja)
  const pekerjaOptions = React.useMemo(() => {
    if (!pekerjaData?.data) return [];
    return pekerjaData.data.map((pekerja) => ({
      value: pekerja.id,
      label: pekerja.nama,
      tarifPerKg:
        pekerja.tarifPekerja?.tarifPerKg != null &&
        pekerja.tarifPekerja?.tarifPerKg !== ""
          ? Number(pekerja.tarifPekerja.tarifPerKg)
          : undefined,
    }));
  }, [pekerjaData]);

  // Memoized configurations (inspector: hanya Detail & Konfirmasi)
  const columns = React.useMemo(
    () => createPenjemuranColumns(handleDeleteClick, handleConfirmClick, handleViewDetail, isInspector),
    [handleConfirmClick, handleViewDetail, isInspector]
  );

  const filterConfigs = React.useMemo(
    () => createPenjemuranFilterConfigs(pekerjaOptions),
    [pekerjaOptions]
  );

  // Loading & Error states
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data penjemuran...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data penjemuran"}
        </div>
      </div>
    );
  }

  return (
    <>
      <PenjemuranForm
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        pekerjaOptions={pekerjaOptions}
        onSubmit={handleAdd}
      />
      <DataTables
        title="Penjemuran"
        description="Kelola data penjemuran di sini"
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
        emptyMessage="Tidak ada penjemuran ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.invoice || `Penjemuran ${row.id}`}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        formDialogOpen={formDialogOpen}
        onFormDialogOpenChange={setFormDialogOpen}
        onAddClick={isInspector ? undefined : () => setFormDialogOpen(true)}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          itemName={deleteItem.name}
          itemType="penjemuran"
        />
      )}

      {confirmPenjemuranData && (
        <ConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={(open) => {
            setConfirmDialogOpen(open);
            if (!open) setConfirmPenjemuranData(null);
          }}
          penjemuran={confirmPenjemuranData}
          onSubmit={handleConfirm}
        />
      )}
    </>
  );
}

export default function PenjemuranPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat data penjemuran...</div>}>
      <PenjemuranContent />
    </Suspense>
  );
}

