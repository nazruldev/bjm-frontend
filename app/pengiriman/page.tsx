"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DataTables } from "@/components/datatables/table";
import { usePengirimans, useUpdatePengiriman } from "@/hooks/usePengiriman";
import { usePenjualans } from "@/hooks/usePenjualans";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import type { GetPengirimansParams, Pengiriman } from "@/services/pengirimanService";
import { createPengirimanColumns } from "@/app/pengiriman/partials/columns";
import { createPengirimanFilterConfigs } from "@/app/pengiriman/partials/filters";
import { PengirimanFormDialog } from "@/app/pengiriman/partials/pengirimanFormDialog";
import { UpdateStatusDialog } from "@/app/pengiriman/partials/updateStatusDialog";
import { useRouter } from "next/navigation";

function PengirimanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const penjualanIdFromUrl = searchParams.get("penjualanId");

  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  const transformFilters = React.useCallback((filters: Record<string, any>) => {
    const transformed: Record<string, any> = {};
    if (filters.status && filters.status !== "__all__") {
      transformed.status = filters.status;
    }
    if (filters.search && typeof filters.search === "string" && filters.search.trim()) {
      transformed.search = filters.search.trim();
    }
    return transformed;
  }, []);

  const queryParams = useTableQuery<GetPengirimansParams>({
    pagination,
    filters: transformFilters(filters),
  });

  const { data, isLoading, error } = usePengirimans(queryParams);
  const { data: penjualanData } = usePenjualans({ limit: 200 });
  const penjualanWithoutPengiriman = React.useMemo(() => {
    const list = penjualanData?.data ?? [];
    return list.filter((p) => !p.pengiriman);
  }, [penjualanData]);

  const [formOpen, setFormOpen] = React.useState(false);
  const [updateStatusOpen, setUpdateStatusOpen] = React.useState(false);
  const [pengirimanForStatus, setPengirimanForStatus] = React.useState<Pengiriman | null>(null);

  React.useEffect(() => {
    if (penjualanIdFromUrl && penjualanWithoutPengiriman.some((p) => p.id === penjualanIdFromUrl)) {
      setFormOpen(true);
      router.replace("/pengiriman", { scroll: false });
    }
  }, [penjualanIdFromUrl, penjualanWithoutPengiriman, router]);

  const handleViewDetail = React.useCallback(
    (id: string) => router.push(`/pengiriman/${id}`),
    [router]
  );
  const handleViewPenjualan = React.useCallback(
    (id: string) => router.push(`/penjualan/${id}`),
    [router]
  );

  const handleOpenUpdateStatus = React.useCallback((pengiriman: Pengiriman) => {
    setPengirimanForStatus(pengiriman);
    setUpdateStatusOpen(true);
  }, []);

  const columns = React.useMemo(
    () => createPengirimanColumns(handleViewDetail, handleViewPenjualan, handleOpenUpdateStatus),
    [handleViewDetail, handleViewPenjualan, handleOpenUpdateStatus]
  );
  const filterConfigs = React.useMemo(() => createPengirimanFilterConfigs(), []);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data pengiriman...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data pengiriman"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Pengiriman"
        description="Daftar pengiriman penjualan"
        data={data?.data || []}
        columns={columns}
        enableRowSelection={false}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={pagination.pageSize}
        pageCount={data?.pagination?.totalPages}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        emptyMessage="Tidak ada pengiriman ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.penjualan?.invoice ?? row.id}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        onAddClick={() => setFormOpen(true)}
      />
      <PengirimanFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        penjualanOptions={penjualanWithoutPengiriman}
        initialPenjualanId={penjualanIdFromUrl}
        onSuccess={() => setFormOpen(false)}
      />
      <UpdateStatusDialog
        open={updateStatusOpen}
        onOpenChange={(open) => {
          setUpdateStatusOpen(open);
          if (!open) setPengirimanForStatus(null);
        }}
        pengiriman={pengirimanForStatus}
        onSuccess={() => setUpdateStatusOpen(false)}
      />
    </>
  );
}

export default function PengirimanPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <PengirimanContent />
    </Suspense>
  );
}
