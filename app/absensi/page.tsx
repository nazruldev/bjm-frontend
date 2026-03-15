"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { useAbsensis } from "@/hooks/useAbsensis";
import { useKaryawans } from "@/hooks/useKaryawans";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import {
  type CreateAbsensiDto,
  type Absensi,
  type GetAbsensisParams,
} from "@/services/absensiService";
import { createAbsensiColumns } from "./partials/columns";
import { createAbsensiFilterConfigs } from "./partials/filters";
import { DeleteDialog } from "@/components/delete-dialog";
import { useAbsensiHandlers } from "./partials/handlers";
import { AbsensiForm } from "./partials/absensiForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX } from "lucide-react";
import { useSearchParams, usePathname } from "next/navigation";
import { toLocalDateStringOnly } from "@/lib/utils";

// Helper untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function AbsensiContent() {
  // Set default filter untuk tanggal hari ini
  const todayDate = React.useMemo(() => getTodayDate(), []);
  const defaultFilters = React.useMemo(
    () => ({
      tanggal: {
        from: todayDate,
        to: todayDate,
      },
    }),
    [todayDate]
  );

  const searchParams = useSearchParams();

  // Table state dengan URL sync (termasuk tanggal)
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  // Reset filter ke default setiap kali halaman dimuat (setiap kali user masuk ke halaman absensi)
  React.useEffect(() => {
    // Reset filter ke default (tanggal hari ini, tanpa filter lain)
    handleFilterSubmit({ ...defaultFilters });
  }, []); // Hanya jalan sekali saat mount - setiap kali user masuk ke halaman, komponen akan di-mount ulang

  // Transform filters to backend format
  const transformFilters = React.useCallback((filters: Record<string, any>) => {
    const transformed: Record<string, any> = {};

    // Karyawan ID
    if (
      filters.karyawanId &&
      typeof filters.karyawanId === "string" &&
      filters.karyawanId !== "__all__"
    ) {
      transformed.karyawanId = filters.karyawanId;
    }

    // Date range - transform object to tanggalFrom, tanggalTo
    if (filters.tanggal && typeof filters.tanggal === "object") {
      if (filters.tanggal.from) {
        transformed.tanggalFrom = filters.tanggal.from;
      }
      if (filters.tanggal.to) {
        transformed.tanggalTo = filters.tanggal.to;
      }
    }

    return transformed;
  }, []);

  // Build query params
  const queryParams = useTableQuery<GetAbsensisParams>({
    pagination,
    filters: transformFilters(filters),
  });

  // Data fetching
  const { data, isLoading, error } = useAbsensis(queryParams);

  // Fetch karyawan untuk dropdown
  const { data: karyawanData } = useKaryawans({ limit: 1000 });

  // Handlers
  const {
    handleAdd: handleAddAbsensi,
    handleDelete: handleDeleteAbsensi,
    handleBatchDelete: handleBatchDeleteAbsensi,
  } = useAbsensiHandlers();

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editAbsensi, setEditAbsensi] = React.useState<Absensi | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);

  // Event handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleEditClick = (absensi: Absensi) => {
    setEditAbsensi(absensi);
    setFormDialogOpen(true);
  };

  const handleAdd = React.useCallback(
    async (formData: CreateAbsensiDto) => {
      await handleAddAbsensi(formData, editAbsensi);
      setEditAbsensi(null);
      setFormDialogOpen(false);
    },
    [handleAddAbsensi, editAbsensi]
  );

  const handleDelete = async () => {
    if (deleteItem) {
      await handleDeleteAbsensi(deleteItem.id);
      setDeleteItem(null);
    }
  };

  // Karyawan options untuk dropdown
  const karyawanOptions = React.useMemo(() => {
    if (!karyawanData?.data) return [];
    return karyawanData.data.map((karyawan) => ({
      value: karyawan.id,
      label: karyawan.nama,
    }));
  }, [karyawanData]);

  // Memoized configurations
  const columns = React.useMemo(
    () => createAbsensiColumns(handleDeleteClick, handleEditClick),
    []
  );

  const filterConfigs = React.useMemo(
    () => createAbsensiFilterConfigs(karyawanOptions),
    [karyawanOptions]
  );

  // Hitung statistik absensi berdasarkan filter tanggal yang aktif
  const stats = React.useMemo(() => {
    const totalKaryawan = karyawanData?.data?.length || 0;
    const absensiData = data?.data || [];
    
    // Ambil tanggal dari filter atau default ke hari ini
    const filterTanggal = filters.tanggal || defaultFilters.tanggal;
    const tanggalFilter = filterTanggal?.from || todayDate;
    
    // Filter absensi berdasarkan tanggal yang dipilih
    const absensiFiltered = absensiData.filter((a) => {
      const absensiDate = toLocalDateStringOnly(a.tanggal);
      return absensiDate === tanggalFilter;
    });
    
    const karyawanIdsYangAbsen = new Set(
      absensiFiltered.map((a) => a.karyawanId)
    );
    const sudahAbsen = karyawanIdsYangAbsen.size;
    const belumAbsen = Math.max(0, totalKaryawan - sudahAbsen);

    return {
      totalKaryawan,
      sudahAbsen,
      belumAbsen,
      tanggalFilter,
    };
  }, [data?.data, karyawanData?.data, filters.tanggal, defaultFilters.tanggal, todayDate]);

  // Loading & Error states
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data absensi...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data absensi"}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Widget Statistik Absensi */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Semua Karyawan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKaryawan}</div>
            <p className="text-xs text-muted-foreground">
              Jumlah total karyawan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sudah Absen</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.sudahAbsen}
            </div>
            <p className="text-xs text-muted-foreground">
              Karyawan yang sudah absen {stats.tanggalFilter === todayDate ? 'hari ini' : `pada ${stats.tanggalFilter}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belum Absen</CardTitle>
            <UserX className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.belumAbsen}
            </div>
            <p className="text-xs text-muted-foreground">
              Karyawan yang belum absen {stats.tanggalFilter === todayDate ? 'hari ini' : `pada ${stats.tanggalFilter}`}
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTables
        title="Absensi"
        description="Kelola data absensi karyawan di sini"
        data={data?.data || []}
        columns={columns}
        onDelete={handleDelete}
        onBatchDelete={handleBatchDeleteAbsensi}
        enableRowSelection={true}
        getRowCanSelect={(row) => !row.penggajianId}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={pagination.pageSize}
        pageCount={data?.pagination?.totalPages}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        emptyMessage="Tidak ada absensi ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => `${row.karyawan?.nama || "Absensi"} - ${row.tanggal}`}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        onAddClick={() => {
          setEditAbsensi(null);
          setFormDialogOpen(true);
        }}
      />

      <AbsensiForm
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditAbsensi(null);
        }}
        initialData={editAbsensi || undefined}
        karyawanOptions={karyawanOptions}
        onSubmit={handleAdd}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          itemName={deleteItem.name}
          itemType="absensi"
        />
      )}
    </>
  );
}

export default function AbsensiPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat data absensi...</div>}>
      <AbsensiContent />
    </Suspense>
  );
}

