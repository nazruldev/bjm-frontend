"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { DataTables } from "@/components/datatables/table";
import { useMutasiStokByProduk } from "@/hooks/useMutasiStoks";
import { useProduk, useProduks } from "@/hooks/useProduks";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import { mutasiStokService, type GetMutasiStoksParams, type MutasiStok } from "@/services/mutasiStokService";
import { createMutasiStokColumns } from "../../partials/columns";
import { createMutasiStokFilterConfigs } from "../../partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { useMutasiStokHandlers } from "../../partials/handlers";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { buildMutasiStokA4Document } from "@/print/templates/mutasiStokA4";
import { openPrintPreviewDocument } from "@/print/openPrintPreview";
import { toast } from "sonner";

function MutasiStokProdukDetailContent() {
  const router = useRouter();
  const params = useParams();
  const produkId = params.produkId as string;

  // Table state untuk detail view
  const {
    pagination: detailPagination,
    filters: detailFilters,
    handlePaginationChange: handleDetailPaginationChange,
    handleFilterSubmit: handleDetailFilterSubmit,
    handleFilterReset: handleDetailFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  // Transform filters to backend format
  const transformFilters = React.useCallback((filters: Record<string, any>) => {
    const transformed: Record<string, any> = {};

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

  // Build query params
  const detailQueryParams = useTableQuery<Omit<GetMutasiStoksParams, "produkId">>({
    pagination: detailPagination,
    filters: transformFilters(detailFilters),
  });

  // Data fetching
  const {
    data: detailData,
    isLoading: detailLoading,
    error: detailError,
  } = useMutasiStokByProduk(produkId, detailQueryParams);

  // Fetch produk info hanya untuk nama produk di description
  const { data: produkData } = useProduk(produkId);

  // Fetch produk untuk dropdown filter
  const { data: produkListData } = useProduks({ limit: 1000 });

  // Handlers
  const { handleDelete: handleDeleteMutasiStok } = useMutasiStokHandlers();

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  // Event handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleViewSource = React.useCallback((mutasiStok: MutasiStok) => {
    const m = mutasiStok as MutasiStok & {
      pengupasanId?: string | null;
      pensortiranId?: string | null;
      penjualanId?: string | null;
    };
    if (m.penjemuranId) router.push(`/penjemuran/${m.penjemuranId}`);
    else if (m.pembelianId) router.push(`/pembelian/${m.pembelianId}`);
    else if (m.pengupasanId) router.push(`/pengupasan/${m.pengupasanId}`);
    else if (m.pensortiranId) router.push(`/pensortiran/${m.pensortiranId}`);
    else if (m.penjualanId) router.push(`/penjualan/${m.penjualanId}`);
  }, [router]);

  const handleDelete = async () => {
    if (deleteItem) {
      await handleDeleteMutasiStok(deleteItem.id);
      setDeleteItem(null);
    }
  };

  // Produk options untuk dropdown
  const produkOptions = React.useMemo(() => {
    if (!produkListData?.data) return [];
    return produkListData.data.map((produk) => ({
      value: produk.id,
      label: `${produk.nama_produk} (${produk.satuan})`,
    }));
  }, [produkListData]);

  // Memoized configurations
  const columns = React.useMemo(
    () => createMutasiStokColumns(handleDeleteClick, handleViewSource),
    [handleViewSource]
  );

  const filterConfigs = React.useMemo(
    () => createMutasiStokFilterConfigs(produkOptions),
    [produkOptions]
  );

  const produkNama = produkData?.data?.nama_produk || "Produk";
  const produkSatuan = produkData?.data?.satuan;

  const handlePrintReport = React.useCallback(async () => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const outletId =
        role === "OWNER"
          ? localStorage.getItem("selectedOutletId")
          : localStorage.getItem("userOutletId");
      if (!outletId) {
        toast.error("Silakan pilih outlet di header terlebih dahulu.");
        return;
      }
    }
    try {
      const reportParams = {
        ...transformFilters(detailFilters),
        page: 1,
        limit: 9999,
      };
      const res = await mutasiStokService.getMutasiStokByProduk(produkId, reportParams);
      const html = buildMutasiStokA4Document({
        produkNama,
        produkSatuan: produkSatuan ?? undefined,
        data: res.data ?? [],
        saldo: res.saldo,
        dateFrom: detailFilters?.tanggal?.from ?? null,
        dateTo: detailFilters?.tanggal?.to ?? null,
        tipe: detailFilters?.tipe ?? null,
        printedAt: new Date(),
        autoPrint: false,
      });
      openPrintPreviewDocument(html, {
        title: `Laporan Mutasi Stok - ${produkNama}`,
        features: "width=820,height=900",
      });
    } catch (e: any) {
      const msg = e?.message || "Gagal memuat data untuk cetak";
      if (/Outlet ID diperlukan|pilih outlet/i.test(msg)) {
        toast.error("Silakan pilih outlet di header terlebih dahulu.");
      } else {
        toast.error(msg);
      }
    }
  }, [produkId, produkNama, produkSatuan, detailFilters, transformFilters]);

  // Loading & Error states (setelah semua hook)
  if (detailLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data mutasi stok...</div>
      </div>
    );
  }

  if (detailError) {
    const isOutletRequired =
      /Outlet ID diperlukan|pilih outlet/i.test(detailError?.message || "") ||
      (detailError as any)?.outletRequired;
    return (
      <div className="p-4">
        <div className="text-destructive">
          {isOutletRequired
            ? "Silakan pilih outlet di header terlebih dahulu."
            : `Error: ${detailError?.message || "Gagal memuat data mutasi stok"}`}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header dengan back button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4 mr-2" />
            Kembali
          </Button>
          <Button onClick={handlePrintReport} variant="outline" size="sm">
            <Printer className="size-4 mr-2" />
            Cetak Laporan
          </Button>
        </div>

        {/* Data Table */}
        <DataTables
          title="Riwayat Mutasi Stok"
          description={`Riwayat mutasi stok untuk ${produkNama}`}
          data={detailData?.data || []}
          columns={columns}
          onDelete={handleDelete}
          enableRowSelection={true}
          enableColumnVisibility={true}
          enablePagination={true}
          pageSize={detailPagination.pageSize}
          pageCount={detailData?.pagination?.totalPages}
          pagination={detailPagination}
          onPaginationChange={handleDetailPaginationChange}
          emptyMessage="Tidak ada mutasi stok ditemukan"
          getRowId={(row) => String(row.id)}
          getNameFromRow={(row) => `${produkNama} - ${row.tipe}`}
          filterConfigs={filterConfigs}
          filterValues={detailFilters}
          onFilterSubmit={handleDetailFilterSubmit}
          onFilterReset={handleDetailFilterReset}
        />
      </div>

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          itemName={deleteItem.name}
          itemType="mutasi stok"
        />
      )}
    </>
  );
}

export default function MutasiStokProdukDetailPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <MutasiStokProdukDetailContent />
    </Suspense>
  );
}

