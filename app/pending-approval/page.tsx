"use client";

import * as React from "react";
import { Suspense } from "react";
import { usePendingApprovals, useResendPendingApproval } from "@/hooks/usePendingApprovals";
import { useAuth } from "@/hooks/useAuth";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import { DataTables } from "@/components/datatables/table";
import { createPendingApprovalColumns } from "./partials/columns";
import { createPendingApprovalFilterConfigs } from "./partials/filters";
import type { GetPendingApprovalsParams } from "@/services/pendingApprovalService";
import type { PendingApprovalItem } from "@/services/pendingApprovalService";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  HUTANG_BAYAR: "Pembayaran Hutang",
  PIUTANG_BAYAR: "Penerimaan Piutang",
  PEMBELIAN_BAYAR: "Pembayaran Pembelian",
  KEUANGAN_CREATE: "Transaksi Keuangan",
  PENGAJIAN_BAYAR: "Pembayaran Gaji",
  PIUTANG_KONFIRMASI_BAYAR: "Konfirmasi Kasbon (Piutang) Cashless",
  PENJEMURAN_BAYAR: "Pembayaran Penjemuran (Cashless)",
  PENGUPASAN_BAYAR: "Pembayaran Pengupasan (Cashless)",
};

function getDisplaySummary(item: PendingApprovalItem): string {
  if (item.displaySummary?.trim()) return item.displaySummary;
  const s = (item.payload?.summary as string)?.trim();
  if (s) return s;
  return `${TYPE_LABELS[item.type] || item.type} - pembayaran cashless menunggu approval owner.`;
}

function getSumberLabel(item: PendingApprovalItem): string {
  if (item.sumberLabel?.trim()) return item.sumberLabel;
  return TYPE_LABELS[item.type] || item.type;
}

function getApprovalUrl(id: string): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? `${window.location.origin}/api` : "http://localhost:3001/api");
  const base = apiUrl.replace(/\/api\/?$/, "");
  return `${base}/api/public/approve?id=${id}`;
}

function PendingApprovalContent() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  const transformFilters = React.useCallback((filters: Record<string, any>) => {
    const out: GetPendingApprovalsParams = {};
    if (filters.type && typeof filters.type === "string") out.type = filters.type;
    if (filters.createdAt && typeof filters.createdAt === "object") {
      if (filters.createdAt.from) out.dateFrom = filters.createdAt.from;
      if (filters.createdAt.to) out.dateTo = filters.createdAt.to;
    }
    return out;
  }, []);

  const queryParams = useTableQuery<GetPendingApprovalsParams>({
    pagination,
    filters: transformFilters(filters),
  });

  const { data, isLoading, error } = usePendingApprovals({
    page: queryParams.page,
    limit: queryParams.limit,
    type: queryParams.type,
    dateFrom: queryParams.dateFrom,
    dateTo: queryParams.dateTo,
  });

  const resendMutation = useResendPendingApproval();
  const [detailItem, setDetailItem] = React.useState<PendingApprovalItem | null>(null);

  const list = data?.data ?? [];
  const pageCount = data?.pagination?.totalPages ?? 0;

  const handleCopyLink = React.useCallback((id: string) => {
    const url = getApprovalUrl(id);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => toast.success("Link disalin"),
        () => toast.error("Gagal menyalin")
      );
    } else {
      toast.info(url);
    }
  }, []);

  const handleResend = React.useCallback(
    (id: string) => resendMutation.mutate(id),
    [resendMutation]
  );

  const columns = React.useMemo(
    () =>
      createPendingApprovalColumns({
        onDetail: setDetailItem,
        onCopyLink: handleCopyLink,
        onResend: handleResend,
        getApprovalUrl,
        isOwner,
      }),
    [handleCopyLink, handleResend, isOwner]
  );

  const filterConfigs = React.useMemo(() => createPendingApprovalFilterConfigs(), []);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="h-7 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive text-sm">Gagal memuat: {(error as Error)?.message}</p>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Menunggu Approval"
        description="Transaksi cashless yang menunggu persetujuan owner via link WA."
        data={list}
        columns={columns}
        enableRowSelection={false}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={pagination.pageSize}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        emptyMessage="Tidak ada transaksi menunggu approval."
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => getSumberLabel(row)}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
      />

      <Sheet open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <SheetContent className="sm:max-w-md">
          {detailItem && (
            <>
              <SheetHeader>
                <SheetTitle>{getSumberLabel(detailItem)}</SheetTitle>
                <SheetDescription>
                  Pembayaran cashless dari sumber di atas.{" "}
                
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-4 text-sm  p-5">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-1">Sumber transaksi</p>
                  <p className="text-foreground font-medium">{getSumberLabel(detailItem)}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {TYPE_LABELS[detailItem.type] || detailItem.type} — menunggu approval owner
                    untuk pencatatan pembayaran via rekening.
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-1">Ringkasan</p>
                  <p className="text-foreground">{getDisplaySummary(detailItem)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-1">Diajukan oleh</p>
                  <p className="text-foreground">{detailItem.createdBy?.nama ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-1">Tanggal</p>
                  <p className="text-foreground">{formatDateTime(detailItem.createdAt)}</p>
                </div>
                {isOwner && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(detailItem.id)}
                    >
                      <Copy className="size-3.5 mr-2" />
                      Copy link
                    </Button>
                    <Button size="sm" asChild>
                      <a
                        href={getApprovalUrl(detailItem.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-3.5 mr-2" />
                        Buka link approval
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <PendingApprovalContent />
    </Suspense>
  );
}
