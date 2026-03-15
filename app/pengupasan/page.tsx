"use client";

import * as React from "react";
import { Suspense } from "react";
import { toast } from "sonner";
import { DataTables } from "@/components/datatables/table";
import { usePengupasans, useConfirmPengupasan } from "@/hooks/usePengupasans";
import { usePekerjas } from "@/hooks/usePekerjas";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import { useAuth } from "@/hooks/useAuth";
import {
  type CreatePengupasanDto,
  type Pengupasan,
  type GetPengupasansParams,
} from "@/services/pengupasanService";
import { createPengupasanColumns } from "./partials/columns";
import { createPengupasanFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { usePengupasanHandlers } from "./partials/handlers";
import { PengupasanForm } from "./partials/pengupasanForm";
import { ConfirmDialog } from "./partials/confirmDialog";
import type { ConfirmPengupasanDto } from "@/services/pengupasanService";
import { useRouter } from "next/navigation";

function PengupasanContent() {
  const router = useRouter();
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
  const queryParams = useTableQuery<GetPengupasansParams>({
    pagination,
    filters: transformFilters(filters),
  });

  // Data fetching
  const { data, isLoading, error } = usePengupasans(queryParams);

  // Fetch pekerja untuk dropdown
  const { data: pekerjaData } = usePekerjas({ limit: 1000, type: "PENGUPAS" });

  // Handlers
  const {
    handleAdd: handleAddPengupasan,
    handleDelete: handleDeletePengupasan,
  } = usePengupasanHandlers();

  // Hook untuk konfirmasi
  const confirmPengupasan = useConfirmPengupasan();

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [confirmPengupasanData, setConfirmPengupasanData] = React.useState<Pengupasan | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);

  // Event handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleAdd = React.useCallback(
    async (formData: CreatePengupasanDto) => {
      await handleAddPengupasan(formData);
      setFormDialogOpen(false);
    },
    [handleAddPengupasan]
  );

  const handleDelete = async () => {
    if (deleteItem) {
      await handleDeletePengupasan(deleteItem.id);
      setDeleteItem(null);
    }
  };

  const handleConfirmClick = (pengupasan: Pengupasan) => {
    setConfirmPengupasanData(pengupasan);
    setConfirmDialogOpen(true);
  };

  const handleViewDetail = (id: string) => {
    router.push(`/pengupasan/${id}`);
  };

  const handleConfirm = React.useCallback(
    async (formData: ConfirmPengupasanDto) => {
      if (confirmPengupasanData) {
        const id = confirmPengupasanData.id;
        await confirmPengupasan.mutateAsync({
          id,
          data: formData,
        });
        setConfirmPengupasanData(null);
        setConfirmDialogOpen(false);
        router.push(`/pengupasan/${id}`);
      }
    },
    [confirmPengupasan, confirmPengupasanData]
  );

  // Pekerja options untuk dropdown
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
    () => createPengupasanColumns(handleDeleteClick, handleConfirmClick, handleViewDetail, isInspector),
    [handleConfirmClick, handleViewDetail, isInspector]
  );

  const filterConfigs = React.useMemo(
    () => createPengupasanFilterConfigs(pekerjaOptions),
    [pekerjaOptions]
  );

  // Loading & Error states
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data pengupasan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data pengupasan"}
        </div>
      </div>
    );
  }

  return (
    <>
      <PengupasanForm
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        pekerjaOptions={pekerjaOptions}
        onSubmit={handleAdd}
      />
      <DataTables
        title="Pengupasan"
        description="Kelola data pengupasan di sini"
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
        emptyMessage="Tidak ada pengupasan ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.invoice || `Pengupasan ${row.id}`}
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
          itemType="pengupasan"
        />
      )}

      {confirmPengupasanData && (
        <ConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={(open) => {
            setConfirmDialogOpen(open);
            if (!open) setConfirmPengupasanData(null);
          }}
          pengupasan={confirmPengupasanData}
          onSubmit={handleConfirm}
        />
      )}
    </>
  );
}

export default function PengupasanPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat data pengupasan...</div>}>
      <PengupasanContent />
    </Suspense>
  );
}
