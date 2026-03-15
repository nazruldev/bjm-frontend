"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePembayarans } from "@/hooks/usePembayarans";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import { type GetPembayaransParams } from "@/services/pembayaranService";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt, Calendar, CreditCard, FileText, Printer } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Pembayaran } from "@/services/pembayaranService";
import { usePiutangDetail } from "@/hooks/usePiutangs";
import { useTableQuery as useTableQueryPiutang } from "@/hooks/useTableQuery";
import type { GetPiutangDetailParams } from "@/services/piutangService";
import { pembayaranService } from "@/services/pembayaranService";
import { openPrintPreviewDocument } from "@/print/openPrintPreview";
import { buildNotaHutangPiutangA4Document } from "@/print/templates/notaHutangPiutangA4";

function PiutangInvoiceDetailContent() {
  const router = useRouter();
  const params = useParams();

  const subjek = params.subjek as string;
  const invoiceId = params.invoiceId as string;
  const subjekType = subjek.split("-")[1];
  const subjekId = subjek.split("-")[0];

  // Get invoice detail from piutang detail
  const { pagination: detailPagination } = useTableState({ defaultPageSize: 100 });
  const detailQueryParams = useTableQueryPiutang<GetPiutangDetailParams>({
    pagination: detailPagination,
    filters: {},
    buildParams: () => ({
      page: 1,
      limit: 100,
      subjekId,
      subjekType: subjekType as "KARYAWAN" | "PEKERJA" | "PEMASOK",
    }),
  });

  const { data: piutangDetailData } = usePiutangDetail(detailQueryParams);
  const { detail, invoice } = React.useMemo(() => {
    if (!piutangDetailData?.data) return { detail: null, invoice: null };
    const d = Array.isArray(piutangDetailData.data)
      ? piutangDetailData.data[0]
      : piutangDetailData.data;
    const inv = d?.invoices?.find((i: any) => i.id === invoiceId);
    return { detail: d, invoice: inv };
  }, [piutangDetailData, invoiceId]);
  const subjekName = detail?.user?.nama ?? "-";

  // Table state untuk pembayaran
  const {
    pagination,
    handlePaginationChange,
  } = useTableState({ defaultPageSize: 10 });

  // Build query params untuk pembayaran
  // Query berdasarkan invoiceId (ID piutang) karena sekarang setiap pembayaran sudah punya sumberId sesuai ID piutang
  const pembayaranQueryParams = useTableQuery<GetPembayaransParams>({
    pagination,
    filters: {},
    buildParams: (pagination) => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      sumberType: "PIUTANG",
      sumberId: invoiceId, // Query berdasarkan ID piutang
    }),
  });

  // Data fetching pembayaran
  const {
    data: pembayaranData,
    isLoading: isLoadingPembayaran,
    error: errorPembayaran,
  } = usePembayarans(pembayaranQueryParams);

  const pembayarans = (pembayaranData?.data || []) as Pembayaran[];
  const totalPages = pembayaranData?.pagination?.totalPages || 1;

  // Event handlers
  const handleBackToList = () => {
    router.back();
  };

  const handlePrint = async () => {
    if (!invoice) return;
    try {
      const res = await pembayaranService.getPembayarans({
        page: 1,
        limit: 100,
        sumberType: "PIUTANG",
        sumberId: invoiceId,
      });
      const allPembayarans = (res.data || []) as Pembayaran[];
      const html = buildNotaHutangPiutangA4Document({
        type: "piutang",
        invoice: {
          id: invoice.id,
          invoice: invoice.invoice,
          total: invoice.total,
          dibayar: invoice.dibayar,
          status: invoice.status,
          createdAt: invoice.createdAt,
          approvedBy: invoice.approvedBy,
          confirmedBy: invoice.confirmedBy,
        },
        pembayarans: allPembayarans.map((p) => ({
          id: p.id,
          invoice: p.invoice,
          total: p.total,
          arus: p.arus,
          createdAt: p.createdAt,
          rekening: p.rekening,
          catatan: p.catatan,
          isCashless: p.isCashless,
        })),
        subjekName,
        autoPrint: false,
      });
      openPrintPreviewDocument(html, { title: `Nota Piutang - ${invoice.invoice}` });
    } catch (e) {
      console.error("Print piutang:", e);
    }
  };

  const getArusBadge = (arus: "MASUK" | "KELUAR") => {
    return arus === "MASUK" ? (
      <Badge variant="default" className="bg-green-600">
        {arus}
      </Badge>
    ) : (
      <Badge variant="destructive">
        {arus}
      </Badge>
    );
  };

  const getStatusBadge = (
    status: "PENDING" | "APPROVED" | "AKTIF" | "PARTIAL" | "LUNAS" | "DIBATALKAN"
  ) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "APPROVED":
        return "default";
      case "LUNAS":
        return "default";
      case "AKTIF":
        return "secondary";
      case "PARTIAL":
        return "outline";
      case "PENDING":
        return "destructive";
      case "DIBATALKAN":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handlePreviousPage = () => {
    if (pagination.pageIndex > 0) {
      handlePaginationChange({
        pageIndex: pagination.pageIndex - 1,
        pageSize: pagination.pageSize,
      });
    }
  };

  const handleNextPage = () => {
    const currentPage = pagination.pageIndex + 1;
    if (currentPage < totalPages) {
      handlePaginationChange({
        pageIndex: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      });
    }
  };

  // Loading state
  if (!invoice && !piutangDetailData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Invoice tidak ditemukan</div>
        <Button onClick={handleBackToList} className="mt-4">
          <ArrowLeft className="mr-2 size-4" />
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Detail Invoice Piutang</h1>
          <p className="text-muted-foreground">
            Invoice: {invoice.invoice}
          </p>
        </div>
        <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 size-4" />
            Print
          </Button>
          <Button onClick={handleBackToList} variant="outline">
            <ArrowLeft className="mr-2 size-4" />
            Kembali
          </Button>
        </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Side: Detail Invoice Card */}
        <div className="space-y-4">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Informasi Invoice
                </CardTitle>
                <Badge variant={getStatusBadge(invoice.status as any)}>
                  {invoice.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              
              {/* Invoice & Total */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="size-4" />
                    Invoice
                  </div>
                  <div className="font-mono font-medium">{invoice.invoice}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    Total
                  </div>
                  <div className="text-xl font-bold">
                    {formatCurrency(invoice.total)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dibayar & Sisa */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Dibayar</div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(invoice.dibayar)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Sisa</div>
                  <div className="text-lg font-semibold text-destructive">
                    {formatCurrency(invoice.total - invoice.dibayar)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tanggal */}
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="size-4" />
                  Tanggal Dibuat
                </div>
                <div className="text-lg">
                  {formatDateTime(invoice.createdAt)}
                </div>
              </div>

              {/* Approved By */}
              {invoice.approvedBy && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">
                      Disetujui Oleh
                    </div>
                    <div className="text-lg font-medium">
                      {invoice.approvedBy.nama}
                    </div>
                  </div>
                </>
              )}

              {/* Confirmed By */}
              {invoice.confirmedBy && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">
                      Dikonfirmasi Oleh
                    </div>
                    <div className="text-lg font-medium">
                      {invoice.confirmedBy.nama}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Daftar Pembayaran */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="size-5" />
              Daftar Pembayaran
            </h2>
            <div className="text-sm text-muted-foreground">
              Halaman {pagination.pageIndex + 1} dari {totalPages}
            </div>
          </div>

        <div className="space-y-3">
          {isLoadingPembayaran ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : errorPembayaran ? (
            <div className="text-destructive p-4 text-sm">
              Error: {errorPembayaran.message || "Gagal memuat data pembayaran"}
            </div>
          ) : pembayarans.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Tidak ada pembayaran ditemukan
            </div>
          ) : (
            pembayarans.map((pembayaran) => {
              const invoiceNumber = pembayaran.invoice || "-";
              const total = formatCurrency(pembayaran.total);
              const tanggal = formatDateTime(pembayaran.createdAt);
              const rekeningInfo = pembayaran.rekening
                ? `${pembayaran.rekening.bank} - ${pembayaran.rekening.nama}`
                : "Tunai";
              const uniqueKey = pembayaran.id || `pembayaran-${invoiceNumber}`;

              return (
                <Card
                  key={uniqueKey}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 gap-3">
                      {/* Header: Invoice & Arus */}
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div className="flex items-center gap-2 min-w-0">
                          <Receipt className="size-4 text-muted-foreground shrink-0" />
                          <span className="font-mono font-medium text-sm truncate">
                            {invoiceNumber}
                          </span>
                        </div>
                        {getArusBadge(pembayaran.arus)}
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                        {/* Total */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {total}
                          </span>
                        </div>

                        {/* Tanggal */}
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {tanggal}
                          </span>
                        </div>

                        {/* Rekening/Metode */}
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground truncate">
                            {rekeningInfo}
                          </span>
                        </div>

                        {/* Cashless Badge */}
                        {pembayaran.isCashless && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Cashless
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Catatan */}
                      {pembayaran.catatan && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Catatan:</span> {pembayaran.catatan}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

          {/* Pagination */}
          {!isLoadingPembayaran && !errorPembayaran && pembayarans.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={pagination.pageIndex === 0}
              >
                <ArrowLeft className="size-4" />
                <span className="sr-only">Previous</span>
              </Button>
              <span className="text-sm text-muted-foreground">
                Halaman {pagination.pageIndex + 1} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={pagination.pageIndex + 1 >= totalPages}
              >
                <ArrowLeft className="size-4 rotate-180" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PiutangInvoiceDetailPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <PiutangInvoiceDetailContent />
    </Suspense>
  );
}

