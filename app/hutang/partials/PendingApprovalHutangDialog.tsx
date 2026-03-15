"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePendingApprovals, useResendPendingApproval } from "@/hooks/usePendingApprovals";
import { useAuth } from "@/hooks/useAuth";
import { useTableState } from "@/hooks/useTableState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, ExternalLink, RefreshCw, Send } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { PendingApprovalItem } from "@/services/pendingApprovalService";
import { useQueryUtils } from "@/lib/query-utils";
import { pendingApprovalKeys } from "@/hooks/usePendingApprovals";
import { ChevronLeft, ChevronRight } from "lucide-react";

function getDisplaySummary(item: PendingApprovalItem): string {
  if (item.displaySummary?.trim()) return item.displaySummary;
  const s = (item.payload?.summary as string)?.trim();
  if (s) return s;
  return "Pembayaran hutang (cashless) menunggu approval owner.";
}

function getSumberLabel(item: PendingApprovalItem): string {
  if (item.sumberLabel?.trim()) return item.sumberLabel;
  return "Pembayaran Hutang";
}

function getApprovalUrl(id: string): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? `${window.location.origin}/api` : "http://localhost:3001/api");
  const base = apiUrl.replace(/\/api\/?$/, "");
  return `${base}/api/public/approve?id=${id}`;
}

export interface PendingApprovalHutangDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dipanggil saat data pertama kali ter-load, untuk update badge di parent (tanpa request count terpisah) */
  onTotalLoaded?: (total: number) => void;
}

export function PendingApprovalHutangDialog({
  open,
  onOpenChange,
  onTotalLoaded,
}: PendingApprovalHutangDialogProps) {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";
  const { pagination, handlePaginationChange } = useTableState({
    defaultPageSize: 10,
  });

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = usePendingApprovals(
    {
      type: "HUTANG_BAYAR",
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    },
    { enabled: open }
  );

  const list = (data?.data ?? []) as PendingApprovalItem[];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalCount = data?.pagination?.total ?? 0;
  const currentPage = pagination.pageIndex + 1;

  React.useEffect(() => {
    if (open && !isLoading && totalCount >= 0) {
      onTotalLoaded?.(totalCount);
    }
  }, [open, isLoading, totalCount, onTotalLoaded]);

  const resendMutation = useResendPendingApproval();
  const { refetchMultipleQueries } = useQueryUtils();

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
    (id: string) => {
      resendMutation.mutate(id, {
        onSuccess: () => {
          refetch();
          refetchMultipleQueries([pendingApprovalKeys.all]);
        },
      });
    },
    [resendMutation, refetch, refetchMultipleQueries]
  );

  const handlePreviousPage = () => {
    if (pagination.pageIndex > 0) {
      handlePaginationChange({
        pageIndex: pagination.pageIndex - 1,
        pageSize: pagination.pageSize,
      });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePaginationChange({
        pageIndex: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Pembayaran Hutang Menunggu Approval (Cashless)</DialogTitle>
          <DialogDescription>
            Daftar pembayaran hutang via cashless yang menunggu persetujuan owner
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
          >
            <RefreshCw className={`size-4 mr-1 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-24 bg-muted animate-pulse rounded-md" />
              <div className="h-24 bg-muted animate-pulse rounded-md" />
              <div className="h-24 bg-muted animate-pulse rounded-md" />
            </div>
          ) : error ? (
            <div className="text-destructive p-4 text-sm">
              Gagal memuat: {(error as Error)?.message}
            </div>
          ) : list.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Tidak ada pembayaran hutang menunggu approval.
            </div>
          ) : (
            list.map((item) => (
             <div className="px-2">
               <Card key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{getSumberLabel(item)}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {getDisplaySummary(item)}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <span>Diajukan: {item.createdBy?.nama ?? "-"}</span>
                        <span>{formatDateTime(item.createdAt)}</span>
                        {item.outlet?.nama && (
                          <span>Outlet: {item.outlet.nama}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {isOwner && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(item.id)}
                          >
                            <Copy className="size-3.5 mr-1" />
                            Link
                          </Button>
                          <Button size="sm" asChild>
                            <a
                              href={getApprovalUrl(item.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="size-3.5 mr-1" />
                              Buka
                            </a>
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResend(item.id)}
                        disabled={resendMutation.isPending}
                      >
                        <Send className="size-3.5 mr-1" />
                        Resend
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
             </div>
            ))
          )}
        </div>

        {!isLoading && !error && list.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages} ({totalCount} item)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
