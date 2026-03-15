"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { usePembayarans } from "@/hooks/usePembayarans";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import { type GetPembayaransParams } from "@/services/pembayaranService";
import { createPembayaranColumns } from "./partials/columns";
import { createPembayaranFilterConfigs } from "./partials/filters";
import { usePembayaranHandlers } from "./partials/handlers";
import { DeleteDialog } from "@/components/delete-dialog";
import { ReusableFormDialog } from "@/components/datatables/customForm";
import { useRekenings } from "@/hooks/useRekenings";
import type { UpdatePembayaranDto } from "@/services/pembayaranService";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useConfirmPassword } from "@/components/dialog-confirm-password";

function PembayaranContent() {
  const router = useRouter();
  
  // Table state untuk list view
  const {
    pagination: listPagination,
    filters: listFilters,
    handlePaginationChange: handleListPaginationChange,
    handleFilterSubmit: handleListFilterSubmit,
    handleFilterReset: handleListFilterReset,
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

    // SumberType
    if (
      filters.sumberType &&
      typeof filters.sumberType === "string" &&
      filters.sumberType !== "__all__"
    ) {
      transformed.sumberType = filters.sumberType;
    }

    // Arus
    if (
      filters.arus &&
      typeof filters.arus === "string" &&
      filters.arus !== "__all__"
    ) {
      transformed.arus = filters.arus;
    }

    // Date range - transform object to dateField, dateFrom, dateTo
    if (filters.dateRange && typeof filters.dateRange === "object") {
      if (filters.dateRange.from || filters.dateRange.to) {
        transformed.dateField = filters.dateField || "createdAt";
        if (filters.dateRange.from) {
          transformed.dateFrom = filters.dateRange.from;
        }
        if (filters.dateRange.to) {
          transformed.dateTo = filters.dateRange.to;
        }
      }
    }

    return Object.entries(transformed).reduce((acc, [key, value]) => {
      if (value === undefined || value === null || value === "") {
        return acc;
      }
      if (typeof value === "object" && !Array.isArray(value)) {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
  }, []);

  // Build query params
  const listQueryParams = useTableQuery<GetPembayaransParams>({
    pagination: listPagination,
    filters: listFilters,
    buildParams: (pagination, filters) => {
      const transformedFilters = transformFilters(filters);
      return {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        ...transformedFilters,
      } as GetPembayaransParams;
    },
  });

  // Data fetching
  const {
    data: listData,
    isLoading: listLoading,
    error: listError,
  } = usePembayarans(listQueryParams);

  // Fetch rekenings untuk edit form
  const { data: rekeningsData, isLoading: isLoadingRekenings } = useRekenings({
    limit: 1000,
    isActive: true,
  });

  // Handlers
  const { handleUpdate, handleDelete } = usePembayaranHandlers();
  const { openConfirmPassword } = useConfirmPassword();

  // Local state untuk dialogs
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedPembayaran, setSelectedPembayaran] = React.useState<{
    id: string;
    invoice: string;
  } | null>(null);

  // Event handlers
  const handleEditClick = (id: string) => {
    const pembayaran = listData?.data?.find((p) => p.id === id);
    if (pembayaran) {
      setSelectedPembayaran({ id: pembayaran.id, invoice: pembayaran.invoice });
      setEditDialogOpen(true);
    }
  };

  const handleDeleteClick = (id: string, invoice: string) => {
    setSelectedPembayaran({ id, invoice });
    setDeleteOpen(true);
  };

  const handleViewDetail = (id: string) => {
    router.push(`/pembayaran/${id}`);
  };

  const handleDeleteConfirm = () => {
    if (!selectedPembayaran) return;
    openConfirmPassword({
      title: "Konfirmasi password",
      description: "Masukkan password Anda untuk menghapus pembayaran ini.",
      onConfirm: async () => {
        await handleDelete(selectedPembayaran.id);
        setSelectedPembayaran(null);
        setDeleteOpen(false);
      },
    });
  };

  const handleEditSubmit = async (values: Record<string, any>) => {
    if (!selectedPembayaran) return;

    const updateData: UpdatePembayaranDto = {
      total: values.total ? Number(values.total) : undefined,
      catatan: values.catatan || null,
      tanggal: values.tanggal ? Number(values.tanggal) : undefined,
      bulan: values.bulan ? Number(values.bulan) : undefined,
      tahun: values.tahun ? Number(values.tahun) : undefined,
    };

    await handleUpdate(selectedPembayaran.id, updateData);
    setEditDialogOpen(false);
    setSelectedPembayaran(null);
  };

  const handleEditSubmitWithPassword = (values: Record<string, any>) => {
    openConfirmPassword({
      title: "Konfirmasi password",
      description: "Masukkan password Anda untuk menyimpan perubahan pembayaran.",
      onConfirm: async () => handleEditSubmit(values),
    });
  };

  // Rekening options
  const rekeningOptions = React.useMemo(() => {
    if (!rekeningsData?.data) return [];
    return rekeningsData.data.map((rekening) => ({
      value: rekening.id,
      label: `${rekening.bank} - ${rekening.nama} (${rekening.nomor})`,
    }));
  }, [rekeningsData]);

  // Edit form config
  const editFormConfig = React.useMemo(() => {
    const pembayaran = listData?.data?.find(
      (p) => p.id === selectedPembayaran?.id
    );

    const updateSchema = z.object({
      total: z.coerce.number().min(1, "Total harus lebih dari 0").optional(),
      catatan: z.string().optional().nullable(),
      tanggal: z.coerce.number().min(1).max(31).optional(),
      bulan: z.coerce.number().min(1).max(12).optional(),
      tahun: z.coerce.number().min(2000).optional(),
    });

    return {
      title: "Edit Pembayaran",
      schema: updateSchema,
      fields: [
        {
          name: "total",
          label: "Total",
          type: "number" as const,
          placeholder: "Masukkan total",
          defaultValue: pembayaran?.total?.toString() || "",
        },
        {
          name: "catatan",
          label: "Catatan",
          type: "textarea" as const,
          placeholder: "Masukkan catatan",
          defaultValue: pembayaran?.catatan || "",
        },
        {
          name: "tanggal",
          label: "Tanggal",
          type: "number" as const,
          placeholder: "1-31",
          defaultValue: pembayaran?.tanggal?.toString() || "",
        },
        {
          name: "bulan",
          label: "Bulan",
          type: "number" as const,
          placeholder: "1-12",
          defaultValue: pembayaran?.bulan?.toString() || "",
        },
        {
          name: "tahun",
          label: "Tahun",
          type: "number" as const,
          placeholder: "YYYY",
          defaultValue: pembayaran?.tahun?.toString() || "",
        },
      ],
      submitLabel: "Update Pembayaran",
      defaultValues: {
        total: pembayaran?.total?.toString() || "",
        catatan: pembayaran?.catatan || "",
        tanggal: pembayaran?.tanggal?.toString() || "",
        bulan: pembayaran?.bulan?.toString() || "",
        tahun: pembayaran?.tahun?.toString() || "",
      },
    };
  }, [listData, selectedPembayaran]);

  // Columns
  const columns = React.useMemo(
    () =>
      createPembayaranColumns(
        handleEditClick,
        handleDeleteClick,
        handleViewDetail
      ),
    []
  );

  // Filter configs
  const filterConfigs = React.useMemo(
    () => createPembayaranFilterConfigs(),
    []
  );

  // Loading state
  if (listLoading || isLoadingRekenings) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data pembayaran...</div>
      </div>
    );
  }

  // Error state
  if (listError) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {listError.message || "Gagal memuat data pembayaran"}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <DataTables
          title="Pembayaran"
          description="Daftar semua pembayaran"
          data={(listData?.data || []) as any}
          columns={columns as any}
          enableRowSelection={false}
          enableColumnVisibility={true}
          enablePagination={true}
          pageSize={listPagination.pageSize}
          pageCount={listData?.pagination?.totalPages}
          pagination={listPagination}
          onPaginationChange={handleListPaginationChange}
          emptyMessage="Tidak ada pembayaran ditemukan"
          getRowId={(row: any) => row.id}
          getNameFromRow={(row: any) => row.invoice}
          filterConfigs={filterConfigs}
          filterValues={listFilters}
          onFilterSubmit={handleListFilterSubmit}
          onFilterReset={handleListFilterReset}
        />
      </div>

      {/* Edit Dialog */}
      {selectedPembayaran && (
        <ReusableFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          config={{
            ...editFormConfig,
            onSubmit: handleEditSubmitWithPassword,
          }}
        />
      )}

      {/* Delete Dialog */}
      {selectedPembayaran && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDeleteConfirm}
          itemName={selectedPembayaran.invoice}
          itemType="pembayaran"
        />
      )}
    </>
  );
}

export default function PembayaranPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <PembayaranContent />
    </Suspense>
  );
}

