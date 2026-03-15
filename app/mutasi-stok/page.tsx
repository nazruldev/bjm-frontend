"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { DataTables } from "@/components/datatables/table";
import { useMutasiStoks, useProdukWithStok } from "@/hooks/useMutasiStoks";
import { useProduks } from "@/hooks/useProduks";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import { type GetMutasiStoksParams, type CreateMutasiStokDto } from "@/services/mutasiStokService";
import { createProdukWithStokColumns } from "./partials/produkColumns";
import { createMutasiStokFilterConfigs } from "./partials/filters";
import { SummaryWidget } from "./partials/summaryWidget";
import { getTodayDateString } from "@/lib/utils";
import { createFormConfig } from "./validations/createValidation";
import { useMutasiStokHandlers } from "./partials/handlers";
import { ReusableFormDialog } from "@/components/datatables/customForm";

function MutasiStokContent() {
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

    // Produk
    if (
      filters.produkId &&
      typeof filters.produkId === "string" &&
      filters.produkId !== "__all__"
    ) {
      transformed.produkId = filters.produkId;
    }

    // Tipe
    if (
      filters.tipe &&
      typeof filters.tipe === "string" &&
      filters.tipe !== "__all__"
    ) {
      transformed.tipe = filters.tipe;
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

  // Build query params untuk produk grouped
  const queryParams = useTableQuery<Omit<GetMutasiStoksParams, "page" | "limit">>({
    pagination,
    filters: transformFilters(filters),
  });

  // Data fetching - menggunakan produk dengan stok (grouped by produk)
  const { data, isLoading, error } = useProdukWithStok(queryParams);

  // Fetch produk untuk dropdown filter
  const { data: produkData } = useProduks({ limit: 1000 });

  // Handlers
  const { handleAdd: handleAddMutasiStok } = useMutasiStokHandlers();

  // Local state untuk form dialog
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [selectedProdukId, setSelectedProdukId] = React.useState<string | null>(null);

  // Handler untuk view detail produk
  const handleViewDetail = React.useCallback(
    (produkId: string) => {
      router.push(`/mutasi-stok/produk/${produkId}`);
    },
    [router]
  );

  // Handler untuk tambah mutasi stok
  const handleAddMutasiStokClick = React.useCallback((produkId: string) => {
    setSelectedProdukId(produkId);
    setFormDialogOpen(true);
  }, []);

  // Handler untuk submit form
  const handleFormSubmit = React.useCallback(
    async (formData: CreateMutasiStokDto) => {
      await handleAddMutasiStok(formData, null);
      setSelectedProdukId(null);
      setFormDialogOpen(false);
    },
    [handleAddMutasiStok]
  );

  // Produk options untuk form dan filter
  const produkOptions = React.useMemo(() => {
    if (!produkData?.data) return [];
    return produkData.data.map((produk) => ({
      value: produk.id,
      label: `${produk.nama_produk} (${produk.satuan})`,
    }));
  }, [produkData]);

  // Memoized configurations - menggunakan columns untuk produk dengan stok
  const columns = React.useMemo(
    () => createProdukWithStokColumns(handleViewDetail, handleAddMutasiStokClick),
    [handleViewDetail, handleAddMutasiStokClick]
  );

  // Form config untuk tambah mutasi stok
  const formConfig = React.useMemo(() => {
    const config = createFormConfig(undefined, produkOptions);
    
    // Update field produkId untuk disable jika sudah dipilih dari kolom aksi
    const updatedFields = config.fields.map((field) => {
      if (field.name === "produkId" && selectedProdukId) {
        return {
          ...field,
          defaultValue: selectedProdukId,
          isDisabled: true,
        };
      }
      return field;
    });

    // Saldo akhir produk yang dipilih (tampil di atas header)
    const selectedProduk = selectedProdukId && data?.data
      ? data.data.find((p) => p.id === selectedProdukId)
      : null;
    const slotAboveHeader = selectedProduk ? (
      <div className="rounded-lg border bg-muted/50 px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Saldo akhir
        </p>
        <p
          className={`text-xl font-bold ${
            selectedProduk.stok.saldoAkhir < 0 ? "text-destructive" : "text-foreground"
          }`}
        >
          {selectedProduk.stok.saldoAkhir.toLocaleString("id-ID")}{" "}
          <span className="text-base font-normal text-muted-foreground">
            {selectedProduk.satuan}
          </span>
        </p>
      </div>
    ) : undefined;

    return {
      ...config,
      fields: updatedFields,
      slotAboveHeader,
      onSubmit: handleFormSubmit,
      defaultValues: {
        ...config.defaultValues,
        produkId: selectedProdukId || "",
        tanggal: getTodayDateString(),
      } as any,
    };
  }, [produkOptions, handleFormSubmit, selectedProdukId, data?.data]);

  const filterConfigs = React.useMemo(
    () => createMutasiStokFilterConfigs(produkOptions),
    [produkOptions]
  );

  // Loading & Error states
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data mutasi stok...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data mutasi stok"}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Summary Widget */}
        <SummaryWidget filters={transformFilters(filters)} />

        {/* Data Table - Produk dengan Stok */}
        <DataTables
          title="Stok Produk"
          description="Daftar produk dengan total stok. Klik detail untuk melihat riwayat mutasi stok."
          data={data?.data || []}
          columns={columns}
          enableRowSelection={false}
          enableColumnVisibility={true}
          enablePagination={true}
          pageSize={pagination.pageSize}
          pageCount={data?.pagination?.totalPages}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          emptyMessage="Tidak ada produk dengan stok ditemukan"
          getRowId={(row) => String(row.id)}
          getNameFromRow={(row) => row.nama_produk}
          filterConfigs={filterConfigs}
          filterValues={filters}
          onFilterSubmit={handleFilterSubmit}
          onFilterReset={handleFilterReset}
        />
      </div>

      {/* Form Dialog untuk Tambah Mutasi Stok */}
      {formDialogOpen && formConfig && (
        <ReusableFormDialog
          key={selectedProdukId || "new"}
          open={formDialogOpen}
          onOpenChange={(open) => {
            setFormDialogOpen(open);
            if (!open) {
              setSelectedProdukId(null);
            }
          }}
          config={formConfig}
          onSuccess={() => {
            setSelectedProdukId(null);
            setFormDialogOpen(false);
          }}
        />
      )}
    </>
  );
}

export default function MutasiStokPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat data mutasi stok...</div>}>
      <MutasiStokContent />
    </Suspense>
  );
}

