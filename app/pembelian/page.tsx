"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { usePembelians } from "@/hooks/usePembelians";
import { useProduks } from "@/hooks/useProduks";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import {
  type CreatePembelianDto,
  type GetPembeliansParams,
} from "@/services/pembelianService";
import { createPembelianColumns } from "./partials/columns";
import { createPembelianFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { usePembelianHandlers } from "./partials/handlers";
import { useRouter } from "next/navigation";
import { usePemasoks } from "@/hooks/usePemasoks";
import { useAuth } from "@/hooks/useAuth";

function PembelianContent() {
  const router = useRouter();
  const { user } = useAuth();
  const canDeletePembelian = user?.role === "OWNER";

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

    // Pemasok ID
    if (
      filters.pemasokId &&
      typeof filters.pemasokId === "string" &&
      filters.pemasokId !== "__all__"
    ) {
      transformed.pemasokId = filters.pemasokId;
    }

    // Search by invoice
    if (filters.search && typeof filters.search === "string") {
      transformed.search = filters.search;
    }

    // Date range - transform object to dateFrom, dateTo
    if (filters.createdAt && typeof filters.createdAt === "object") {
      if (filters.createdAt.from) {
        transformed.dateFrom = filters.createdAt.from;
      }
      if (filters.createdAt.to) {
        transformed.dateTo = filters.createdAt.to;
      }
    }

    return transformed;
  }, []);

  // Build query params
  const queryParams = useTableQuery<GetPembeliansParams>({
    pagination,
    filters: transformFilters(filters),
  });

  // Data fetching
  const { data, isLoading, error } = usePembelians(queryParams);

  // Fetch pemasok dari service pemasok
  const { data: pemasokData } = usePemasoks({ limit: 1000 });

  // Handlers
  const { handleDelete: handleDeletePembelian } = usePembelianHandlers();

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  // Event handlers
  const handleDeleteClick = React.useCallback((id: string, invoice: string) => {
    setDeleteItem({ id, name: invoice });
    setDeleteOpen(true);
  }, []);

  const handleViewDetail = React.useCallback(
    (id: string) => {
      router.push(`/pembelian/${id}`);
    },
    [router]
  );

  const handleDelete = React.useCallback(async () => {
    if (deleteItem) {
      try {
        await handleDeletePembelian(deleteItem.id);
        setDeleteItem(null);
        setDeleteOpen(false);
      } catch (error) {
        // Error sudah di-handle di handler
      }
    }
  }, [deleteItem, handleDeletePembelian]);

  // Close delete dialog
  const handleDeleteDialogClose = React.useCallback((open: boolean) => {
    setDeleteOpen(open);
    if (!open) {
      setDeleteItem(null);
    }
  }, []);

  // Prepare options
  const pemasokOptions = React.useMemo(() => {
    if (!pemasokData?.data) return [];
    return pemasokData.data.map((p) => ({
      value: p.id,
      label: p.nama,
    }));
  }, [pemasokData]);

  const columns = React.useMemo(
    () => createPembelianColumns(handleViewDetail, handleDeleteClick, canDeletePembelian),
    [handleViewDetail, handleDeleteClick, canDeletePembelian]
  );

  const filterConfigs = React.useMemo(
    () => createPembelianFilterConfigs(pemasokOptions),
    [pemasokOptions]
  );

  // Loading & Error states
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data pembelian...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data pembelian"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Pembelian"
        description="Kelola data pembelian di sini"
        data={data?.data || []}
        columns={columns}
        enableRowSelection={false}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={pagination.pageSize}
        pageCount={data?.pagination?.totalPages}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        emptyMessage="Tidak ada pembelian ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.invoice}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        onAddClick={() => {
          router.push("/pembelian/pos");
        }}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={handleDeleteDialogClose}
          onConfirm={handleDelete}
          itemName={deleteItem.name}
          itemType="pembelian"
        />
      )}
    </>
  );
}

export default function PembelianPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat data pembelian...</div>}>
      <PembelianContent />
    </Suspense>
  );
}
