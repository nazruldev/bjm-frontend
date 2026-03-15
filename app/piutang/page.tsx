"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { usePiutangs } from "@/hooks/usePiutangs";
import { useKaryawans } from "@/hooks/useKaryawans";
import { usePekerjas } from "@/hooks/usePekerjas";
import { useRekenings } from "@/hooks/useRekenings";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import {
  type CreatePiutangDto,
  type BayarPiutangDto,
  type GetPiutangsParams,
} from "@/services/piutangService";
import {
  createPiutangFormConfig,
  createBayarPiutangFormConfig,
} from "./validations/createValidation";
import { createPiutangGroupedColumns } from "./partials/columns";
import { createPiutangFilterConfigs } from "./partials/filters";

import { usePiutangHandlers } from "./partials/handlers";
import { ReusableFormDialog } from "@/components/datatables/customForm";
import { useRouter } from "next/navigation";
import { PendingInvoicesDialog } from "./partials/pendingInvoicesDialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePiutangCountByStatus } from "@/hooks/usePiutangs";
import { useQueryUtils } from "@/lib/query-utils";
import { useConfirmPassword } from "@/components/dialog-confirm-password";

function PiutangContent() {
  // Table state untuk list view
  const { refetchMultipleQueries } = useQueryUtils();
  const router = useRouter();
  const {
    pagination: listPagination,
    filters: listFilters,
    handlePaginationChange: handleListPaginationChange,
    handleFilterSubmit: handleListFilterSubmit,
    handleFilterReset: handleListFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  // Build query params
  const listQueryParams = useTableQuery<GetPiutangsParams>({
    pagination: listPagination,
    filters: listFilters,
  });

  // Data fetching
  const {
    data: listData,
    isLoading: listLoading,
    error: listError,
  } = usePiutangs(listQueryParams);

  // Fetch options untuk dropdowns - fetch langsung saat halaman dimuat
  const { data: karyawansData, isLoading: isLoadingKaryawans } = useKaryawans({
    limit: 1000,
  });
  const { data: pekerjasData, isLoading: isLoadingPekerjas } = usePekerjas({
    limit: 1000,
  });
  const { data: rekeningsData, isLoading: isLoadingRekenings } = useRekenings({
    limit: 1000,
    isActive: true,
  });

  const { openConfirmPassword } = useConfirmPassword();
  const { handleCreate, handleBayar } = usePiutangHandlers();

  // Get pending and approved count
  const { data: countData } = usePiutangCountByStatus({
    status: "PENDING,APPROVED",
  });
  const pendingCount = countData?.data?.PENDING || 0;
  const approvedCount = countData?.data?.APPROVED || 0;
  const totalPendingApproved = pendingCount + approvedCount;

  // Local state untuk dialogs
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [bayarDialogOpen, setBayarDialogOpen] = React.useState(false);
  const [pendingDialogOpen, setPendingDialogOpen] = React.useState(false);
  const [selectedSubjekType, setSelectedSubjekType] = React.useState<
    "KARYAWAN" | "PEKERJA" | "PEMASOK" | ""
  >("KARYAWAN"); // Default to KARYAWAN
  const [selectedSubjekForBayar, setSelectedSubjekForBayar] = React.useState<{
    subjekId: string;
    subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
    sisaPiutang?: number;
  } | null>(null);

  // Event handlers
  const handleViewDetail = (
    subjekId: string,
    subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK"
  ) => {
    // Navigate to detail page using Next.js router
    router.push(`/piutang/${subjekId}-${subjekType}`);
  };

  const handleBayarClick = (
    subjekId: string,
    subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK",
    name: string
  ) => {
    // Find the piutang data to get sisaPiutang
    const piutangData = listData?.data?.find(
      (p: any) => p.subjekId === subjekId && p.subjekType === subjekType
    );
    setSelectedSubjekForBayar({ 
      subjekId, 
      subjekType,
      sisaPiutang: piutangData?.sisaPiutang 
    });
    setBayarDialogOpen(true);
  };

  const handleBayarSubmit = async (formData: BayarPiutangDto) => {
    if (!selectedSubjekForBayar) return;
    await handleBayar({
      ...formData,
      subjekId: selectedSubjekForBayar.subjekId,
      subjekType: selectedSubjekForBayar.subjekType,
    });
    setBayarDialogOpen(false);
    setSelectedSubjekForBayar(null);
  };

  const handleBayarSubmitWithPassword = (formData: BayarPiutangDto) => {
    openConfirmPassword({
      title: "Konfirmasi password",
      description: "Masukkan password Anda untuk pembayaran kasbon.",
      onConfirm: async () => handleBayarSubmit(formData),
    });
  };

  const handleCreateSubmit = async (formData: CreatePiutangDto) => {
    await handleCreate(formData);
    setCreateDialogOpen(false);
    setSelectedSubjekType("");
    // Refetch multiple queries sekaligus
    await refetchMultipleQueries([
      ["piutang", "pending"],
      ["piutang", "count"],
    ]);
  };

  // Options untuk dropdowns
  const karyawanOptions = React.useMemo(() => {
    if (!karyawansData?.data) return [];
    return karyawansData.data.map((karyawan) => ({
      value: karyawan.id,
      label: karyawan.nama,
    }));
  }, [karyawansData]);

  const pekerjaOptions = React.useMemo(() => {
    if (!pekerjasData?.data) return [];
    return pekerjasData.data.map((pekerja) => ({
      value: pekerja.id,
      label: pekerja.nama,
    }));
  }, [pekerjasData]);

  const pemasokOptions = React.useMemo(() => {
    // TODO: Add pemasok service if available
    return [];
  }, []);

  const rekeningOptions = React.useMemo(() => {
    if (!rekeningsData?.data) return [];
    return rekeningsData.data.map((rekening) => ({
      value: rekening.id,
      label: `${rekening.bank} - ${rekening.nama}`,
    }));
  }, [rekeningsData]);

  // Form configs - dibuat dinamis berdasarkan selectedSubjekType
  const createFormConfig = React.useMemo(() => {
    const config = createPiutangFormConfig();

    // Set default subjekType to KARYAWAN
    const subjekTypeField = config.fields.find((f) => f.name === "subjekType");
    if (subjekTypeField) {
      subjekTypeField.defaultValue = selectedSubjekType || "KARYAWAN";
    }

    // Update subjekId options based on selected subjekType
    const subjekIdField = config.fields.find((f) => f.name === "subjekId");
    if (subjekIdField) {
      let options: { value: string; label: string }[] = [];
      const currentSubjekType = selectedSubjekType || "KARYAWAN";
      if (currentSubjekType === "KARYAWAN") {
        options = karyawanOptions;
      } else if (currentSubjekType === "PEKERJA") {
        options = pekerjaOptions;
      } else if (currentSubjekType === "PEMASOK") {
        options = pemasokOptions;
      }
      // Create new field object to trigger re-render
      const updatedFields = config.fields.map((field) => {
        if (field.name === "subjekId") {
          return {
            ...field,
            options: options,
            placeholder:
              options.length > 0
                ? "Pilih subjek"
                : "Pilih tipe subjek terlebih dahulu",
            defaultValue: "", // Always reset when options change
          };
        }
        return field;
      });
      return {
        ...config,
        fields: updatedFields,
        defaultValues: {
          ...config.defaultValues,
          subjekType: currentSubjekType,
        } as any,
      };
    }
    return config;
  }, [karyawanOptions, pekerjaOptions, pemasokOptions, selectedSubjekType]);

  // Columns
  const groupedColumns = React.useMemo(
    () =>
      createPiutangGroupedColumns(
        (subjekId: string, subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK") =>
          handleViewDetail(subjekId, subjekType),
        (
          subjekId: string,
          subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK",
          name: string
        ) => handleBayarClick(subjekId, subjekType, name)
      ),
    []
  );

  // Bayar form config
  const bayarFormConfig = React.useMemo(
    () => createBayarPiutangFormConfig(rekeningOptions, selectedSubjekForBayar?.sisaPiutang),
    [rekeningOptions, selectedSubjekForBayar?.sisaPiutang]
  );

  // Filter configs
  const listFilterConfigs = React.useMemo(
    () => createPiutangFilterConfigs(),
    []
  );

  // Loading state
  if (
    listLoading ||
    isLoadingKaryawans ||
    isLoadingPekerjas ||
    isLoadingRekenings
  ) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data kasbon...</div>
      </div>
    );
  }

  // Error state
  if (listError) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {listError.message || "Gagal memuat data kasbon"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Kasbon"
        description="Kelola data kasbon di sini"
        data={(listData?.data || []) as any}
        columns={groupedColumns as any}
        enableRowSelection={false}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={listPagination.pageSize}
        pageCount={listData?.pagination?.totalPages}
        pagination={listPagination}
        onPaginationChange={handleListPaginationChange}
        emptyMessage="Tidak ada kasbon ditemukan"
        getRowId={(row: any) => `${row.subjekType}-${row.subjekId}`}
        getNameFromRow={(row: any) => row.user?.nama || "Kasbon"}
        filterConfigs={listFilterConfigs}
        filterValues={listFilters}
        onFilterSubmit={handleListFilterSubmit}
        onFilterReset={handleListFilterReset}
        onAddClick={() => setCreateDialogOpen(true)}
        customButtons={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPendingDialogOpen(true)}
            className="relative"
          >
            <Clock className="size-4" />
            <span className="hidden lg:flex items-center gap-2">
              Pending & Approved{" "}
              {totalPendingApproved > 0 && (
                <Badge
                  variant="destructive"
                  className="size-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalPendingApproved > 99 ? "99+" : totalPendingApproved}
                </Badge>
              )}
            </span>
            <span className="lg:hidden">
              {totalPendingApproved > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 size-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalPendingApproved > 99 ? "99+" : totalPendingApproved}
                </Badge>
              )}
            </span>
          </Button>
        }
      />

      {/* Create Dialog */}
      <ReusableFormDialog
        key="create-piutang"
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setSelectedSubjekType("KARYAWAN"); // Reset to default
          }
        }}
        config={{
          ...createFormConfig,
          onSubmit: handleCreateSubmit,
        }}
        onFieldChange={(fieldName, value, form) => {
          if (fieldName === "subjekType") {
            setSelectedSubjekType(value as any);
            // Reset subjekId when subjekType changes
            if (form) {
              form.setFieldValue("subjekId", "" as any, { dontValidate: true });
            }
          }
        }}
      />

      {/* Bayar Dialog */}
      <ReusableFormDialog
        open={bayarDialogOpen}
        onOpenChange={(open) => {
          setBayarDialogOpen(open);
          if (!open) {
            setSelectedSubjekForBayar(null);
          }
        }}
        config={{
          ...bayarFormConfig,
          onSubmit: handleBayarSubmitWithPassword,
        }}
      />

      {/* Pending Invoices Dialog */}
      <PendingInvoicesDialog
        open={pendingDialogOpen}
        onOpenChange={setPendingDialogOpen}
        totalPendingCount={pendingCount}
        totalApprovedCount={approvedCount}
      />
    </>
  );
}

export default function PiutangPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat data kasbon...</div>}>
      <PiutangContent />
    </Suspense>
  );
}
