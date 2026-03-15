"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { usePelanggans } from "@/hooks/usePelanggans";
import { useTableState } from "@/hooks/useTableState";
import { createPelangganColumns } from "./partials/columns";
import { createPelangganFilterConfigs } from "./partials/filters";

function PelangganContent() {
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 20 });

  const search = typeof filters.search === "string" ? filters.search : undefined;
  const { data: pelangganResponse, isLoading, error } = usePelanggans({
    search: search?.trim() || undefined,
    limit: 1000,
  });

  const allData = pelangganResponse?.data ?? [];
  const pageSize = pagination.pageSize;
  const pageIndex = pagination.pageIndex;
  const totalPages = Math.max(1, Math.ceil(allData.length / pageSize));
  const paginatedData = React.useMemo(() => {
    const start = pageIndex * pageSize;
    return allData.slice(start, start + pageSize);
  }, [allData, pageIndex, pageSize]);

  const columns = React.useMemo(() => createPelangganColumns(), []);
  const filterConfigs = React.useMemo(() => createPelangganFilterConfigs(), []);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data pelanggan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data pelanggan"}
        </div>
      </div>
    );
  }

  return (
    <DataTables
      title="Pelanggan"
      description="Daftar pelanggan"
      data={paginatedData}
      columns={columns}
      enableRowSelection={false}
      enableColumnVisibility={true}
      enablePagination={true}
      pageSize={pagination.pageSize}
      pageCount={totalPages}
      pagination={pagination}
      onPaginationChange={handlePaginationChange}
      emptyMessage="Tidak ada pelanggan ditemukan"
      getRowId={(row) => String(row.id)}
      getNameFromRow={(row) => row.nama}
      filterConfigs={filterConfigs}
      filterValues={filters}
      onFilterSubmit={handleFilterSubmit}
      onFilterReset={handleFilterReset}
    />
  );
}

export default function PelangganPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <PelangganContent />
    </Suspense>
  );
}
