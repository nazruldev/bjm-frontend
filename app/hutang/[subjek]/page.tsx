"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { DataTables } from "@/components/datatables/table";
import { useHutangDetail } from "@/hooks/useHutangs";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import { type GetHutangDetailParams } from "@/services/hutangService";
import { createHutangInvoiceColumns } from "./partials/columns";
import { createHutangInvoiceFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { useHutangDetailHandlers } from "./partials/handlers";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function HutangDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const canDeleteHutang = user?.role === "OWNER";

  const subjek = params.subjek as string;
  const subjekType = subjek.split("-")[1];
  const subjekId = subjek.split("-")[0];
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

    // Search
    if (
      filters.search &&
      typeof filters.search === "string" &&
      filters.search.trim()
    ) {
      transformed.search = filters.search.trim();
    }

    // Status - convert to comma-separated string if array
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        transformed.status = filters.status.join(",");
      } else if (
        typeof filters.status === "string" &&
        filters.status !== "__all__"
      ) {
        transformed.status = filters.status;
      }
    }

    // Date range - transform object to dateField, dateFrom, dateTo
    if (filters.dateRange && typeof filters.dateRange === "object") {
      if (filters.dateRange.from || filters.dateRange.to) {
        // Default to createdAt if dateField not selected
        transformed.dateField = filters.dateField || "createdAt";
        if (filters.dateRange.from) {
          transformed.dateFrom = filters.dateRange.from;
        }
        if (filters.dateRange.to) {
          transformed.dateTo = filters.dateRange.to;
        }
      }
    }

    // Total range - transform object to totalMin, totalMax
    if (filters.total && typeof filters.total === "object") {
      if (
        filters.total.min !== undefined &&
        filters.total.min !== null &&
        filters.total.min !== ""
      ) {
        transformed.totalMin = Number(filters.total.min);
      }
      if (
        filters.total.max !== undefined &&
        filters.total.max !== null &&
        filters.total.max !== ""
      ) {
        transformed.totalMax = Number(filters.total.max);
      }
    }

    // Order by
    if (
      filters.orderBy &&
      typeof filters.orderBy === "string" &&
      filters.orderBy !== "__all__"
    ) {
      transformed.orderBy = filters.orderBy;
    }
    if (
      filters.orderDirection &&
      typeof filters.orderDirection === "string" &&
      filters.orderDirection !== "__all__"
    ) {
      transformed.orderDirection = filters.orderDirection;
    }

    // Backward compatible: bulan & tahun
    if (filters.bulan && typeof filters.bulan === "number") {
      transformed.bulan = filters.bulan;
    }
    if (filters.tahun && typeof filters.tahun === "number") {
      transformed.tahun = filters.tahun;
    }

    // Remove any invalid filters (objects, arrays that shouldn't be there, etc.)
    // Only return primitive values that are valid
    return Object.entries(transformed).reduce((acc, [key, value]) => {
      // Skip if value is undefined, null, empty string, or object that shouldn't be there
      if (value === undefined || value === null || value === "") {
        return acc;
      }
      // Skip if it's an object that we haven't transformed (like old createdAt filter)
      if (typeof value === "object" && !Array.isArray(value)) {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
  }, []);

  // Build detail query params
  const detailQueryParamsBase = useTableQuery<GetHutangDetailParams>({
    pagination: detailPagination,
    filters: detailFilters,
    buildParams: (pagination, filters) => {
      const transformedFilters = transformFilters(filters);
      return {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        ...transformedFilters,
      } as GetHutangDetailParams;
    },
  });

  // Combine with subjekId and subjekType
  const detailQueryParams = React.useMemo<GetHutangDetailParams | null>(() => {
    if (!subjekId || !subjekType) return null;
    return {
      ...detailQueryParamsBase,
      subjekId: subjekId,
      subjekType: subjekType as "KARYAWAN" | "PEKERJA" | "PEMASOK",
    };
  }, [subjekId, subjekType, detailQueryParamsBase]);

  // Data fetching
  const {
    data: detailData,
    isLoading: detailLoading,
    error: detailError,
  } = useHutangDetail(detailQueryParams);

  // Handlers
  const { handleDelete } = useHutangDetailHandlers();

  // Local state untuk dialogs
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  // Event handlers
  const handleBackToList = () => {
    router.back();
  };

  const handleDeleteClick = (id: string, invoice: string) => {
    setDeleteItem({ id, name: invoice });
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteItem) {
      await handleDelete(deleteItem.id);
      setDeleteItem(null);
      setDeleteOpen(false);
    }
  };

  // Event handler untuk view pembayaran
  const handleViewPembayaran = (invoiceId: string) => {
    router.push(`/hutang/${subjek}/${invoiceId}`);
  };

  const invoiceColumns = React.useMemo(
    () =>
      createHutangInvoiceColumns(
        (id, invoice) => handleDeleteClick(id, invoice),
        handleViewPembayaran,
        canDeleteHutang
      ),
    [subjek, canDeleteHutang]
  );

  // Filter configs
  const detailFilterConfigs = React.useMemo(
    () => createHutangInvoiceFilterConfigs(),
    []
  );

  // Clean up invalid filters from state (e.g., old createdAt filter)
  // Only run once on mount to clean up old filters from URL
  React.useEffect(() => {
    const validFilterKeys = new Set(detailFilterConfigs.map((f) => f.key));
    const invalidKeys = Object.keys(detailFilters).filter(
      (key) => !validFilterKeys.has(key)
    );

    if (invalidKeys.length > 0) {
      const cleanedFilters = Object.entries(detailFilters).reduce(
        (acc, [key, value]) => {
          if (validFilterKeys.has(key)) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, any>
      );
      // Only update if there are actually invalid filters
      if (
        Object.keys(cleanedFilters).length !== Object.keys(detailFilters).length
      ) {
        handleDetailFilterSubmit(cleanedFilters);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Get detail data
  const detail = React.useMemo(() => {
    if (!detailData?.data) return null;
    return Array.isArray(detailData.data)
      ? detailData.data[0]
      : detailData.data;
  }, [detailData]);

  const invoices = detail?.invoices || [];

  // Loading state
  if (detailLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat detail hutang...</div>
      </div>
    );
  }

  // Error state
  if (detailError) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {detailError.message || "Gagal memuat detail hutang"}
        </div>
      </div>
    );
  }

  // No data
  if (!detail) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Data tidak ditemukan</div>
        <Button onClick={handleBackToList} className="mt-4">
          <ArrowLeft className="mr-2 size-4" />
          Kembali ke List
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Detail Hutang</h2>
              {detail.user && (
                <p className="text-muted-foreground">
                  {detail.user.nama} ({detail.subjekType})
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <DataTables
          title="Invoice"
          description="Daftar invoice hutang"
          data={invoices as any}
          columns={invoiceColumns as any}
          enableRowSelection={false}
          enableColumnVisibility={true}
          enablePagination={true}
          pageSize={detailPagination.pageSize}
          pageCount={detailData?.pagination?.totalPages}
          pagination={detailPagination}
          onPaginationChange={handleDetailPaginationChange}
          emptyMessage="Tidak ada invoice ditemukan"
          getRowId={(row: any) => row.id}
          getNameFromRow={(row: any) => row.invoice}
          filterConfigs={detailFilterConfigs}
          filterValues={detailFilters}
          onFilterSubmit={handleDetailFilterSubmit}
          onFilterReset={handleDetailFilterReset}
        />
      </div>

      {/* Delete Dialog */}
      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDeleteConfirm}
          itemName={deleteItem.name}
          itemType="hutang"
        />
      )}
    </>
  );
}

export default function HutangDetailPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat detail hutang...</div>}>
      <HutangDetailContent />
    </Suspense>
  );
}

