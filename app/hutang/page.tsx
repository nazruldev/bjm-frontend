"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { useHutangs } from "@/hooks/useHutangs";
import { useRekenings } from "@/hooks/useRekenings";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import {
  type BayarHutangDto,
  type GetHutangsParams,
} from "@/services/hutangService";
import { createBayarHutangFormConfig } from "./validations/createValidation";
import { createHutangGroupedColumns } from "./partials/columns";
import { createHutangFilterConfigs } from "./partials/filters";

import { useHutangHandlers } from "./partials/handlers";
import { ReusableFormDialog } from "@/components/datatables/customForm";
import { useRouter } from "next/navigation";
import { useQueryUtils } from "@/lib/query-utils";
import { PendingApprovalHutangDialog } from "./partials/PendingApprovalHutangDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

function HutangContent() {
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
  const listQueryParams = useTableQuery<GetHutangsParams>({
    pagination: listPagination,
    filters: listFilters,
  });

  // Data fetching
  const {
    data: listData,
    isLoading: listLoading,
    error: listError,
  } = useHutangs(listQueryParams);

  // Fetch options untuk dropdowns
  const { data: rekeningsData, isLoading: isLoadingRekenings } = useRekenings({
    limit: 1000,
    isActive: true,
  });

  // Handlers
  const { handleBayar } = useHutangHandlers();

  // Count dari dialog saat dibuka (tanpa request terpisah untuk badge)
  const [pendingApprovalCount, setPendingApprovalCount] = React.useState(0);

  // Local state untuk dialogs
  const [bayarDialogOpen, setBayarDialogOpen] = React.useState(false);
  const [pendingDialogOpen, setPendingDialogOpen] = React.useState(false);
  const [selectedSubjekForBayar, setSelectedSubjekForBayar] = React.useState<{
    subjekId: string;
    subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
    sisaHutang?: number;
  } | null>(null);

  // Event handlers
  const handleViewDetail = (
    subjekId: string,
    subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK"
  ) => {
    // Navigate to detail page using Next.js router
    router.push(`/hutang/${subjekId}-${subjekType}`);
  };

  const handleBayarClick = (
    subjekId: string,
    subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK",
    name: string
  ) => {
    // Find the hutang data to get sisaHutang
    const hutangData = listData?.data?.find(
      (h: any) => h.subjekId === subjekId && h.subjekType === subjekType
    );
    setSelectedSubjekForBayar({ 
      subjekId, 
      subjekType,
      sisaHutang: hutangData?.sisaHutang 
    });
    setBayarDialogOpen(true);
  };

  const handleBayarSubmit = async (formData: BayarHutangDto) => {
    if (!selectedSubjekForBayar) return;
    await handleBayar({
      ...formData,
      subjekId: selectedSubjekForBayar.subjekId,
      subjekType: selectedSubjekForBayar.subjekType,
    });
    setBayarDialogOpen(false);
    setSelectedSubjekForBayar(null);
    // Refetch multiple queries sekaligus
    await refetchMultipleQueries([
      ["hutang", "count"],
    ]);
  };

  const rekeningOptions = React.useMemo(() => {
    if (!rekeningsData?.data) return [];
    return rekeningsData.data.map((rekening) => ({
      value: rekening.id,
      label: `${rekening.bank} - ${rekening.nama}`,
    }));
  }, [rekeningsData]);

  // Columns
  const groupedColumns = React.useMemo(
    () =>
      createHutangGroupedColumns(
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
    () => createBayarHutangFormConfig(rekeningOptions, selectedSubjekForBayar?.sisaHutang),
    [rekeningOptions, selectedSubjekForBayar?.sisaHutang]
  );

  // Filter configs
  const listFilterConfigs = React.useMemo(
    () => createHutangFilterConfigs(),
    []
  );

  // Loading state
  if (listLoading || isLoadingRekenings) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data hutang...</div>
      </div>
    );
  }

  // Error state
  if (listError) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {listError.message || "Gagal memuat data hutang"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Hutang"
        description="Kelola data hutang di sini"
        data={(listData?.data || []) as any}
        columns={groupedColumns as any}
        enableRowSelection={false}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={listPagination.pageSize}
        pageCount={listData?.pagination?.totalPages}
        pagination={listPagination}
        onPaginationChange={handleListPaginationChange}
        emptyMessage="Tidak ada hutang ditemukan"
        getRowId={(row: any) => `${row.subjekType}-${row.subjekId}`}
        getNameFromRow={(row: any) => row.user?.nama || "Hutang"}
        filterConfigs={listFilterConfigs}
        filterValues={listFilters}
        onFilterSubmit={handleListFilterSubmit}
        onFilterReset={handleListFilterReset}
        customButtons={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPendingDialogOpen(true)}
            className="relative"
          >
            <Clock className="size-4" />
            <span className="hidden lg:flex items-center gap-2">
              Menunggu Approval{" "}
              {pendingApprovalCount > 0 && (
                <Badge
                  variant="destructive"
                  className="size-5 flex items-center justify-center p-0 text-xs"
                >
                  {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
                </Badge>
              )}
            </span>
            <span className="lg:hidden">
              {pendingApprovalCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 size-5 flex items-center justify-center p-0 text-xs"
                >
                  {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
                </Badge>
              )}
            </span>
          </Button>
        }
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
          onSubmit: handleBayarSubmit,
        }}
      />

      {/* Dialog pembayaran hutang menunggu approval (cashless) */}
      <PendingApprovalHutangDialog
        open={pendingDialogOpen}
        onOpenChange={setPendingDialogOpen}
        onTotalLoaded={setPendingApprovalCount}
      />

    </>
  );
}

export default function HutangPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat data hutang...</div>}>
      <HutangContent />
    </Suspense>
  );
}

