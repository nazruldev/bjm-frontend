"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePengupasan } from "@/hooks/usePengupasans";
import { usePembayarans } from "@/hooks/usePembayarans";
import { useTableQuery } from "@/hooks/useTableQuery";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Package, FileText, CheckCircle2, Clock, XCircle, Receipt, CreditCard, ExternalLink, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { formatCurrency, formatDate, formatDateTime, formatDecimal } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import type { GetPembayaransParams } from "@/services/pembayaranService";
import type { Pembayaran } from "@/services/pembayaranService";
import { openPrintPreviewDocument } from "@/print/openPrintPreview";
import { buildPengupasanNotaDocument } from "@/print/templates/pengupasanNota";
import { buildPengupasanA4Document } from "@/print/templates/pengupasanA4";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PengupasanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Fetch pengupasan data
  const { data: pengupasanData, isLoading, error } = usePengupasan(id);

  // Build query params untuk pembayaran (hanya 1 pembayaran)
  const pembayaranQueryParams = useTableQuery<GetPembayaransParams>({
    pagination: { pageIndex: 0, pageSize: 1 },
    filters: {},
    buildParams: () => ({
      page: 1,
      limit: 1,
      sumberType: "PENGUPASAN",
      sumberId: id,
    }),
  });

  // Data fetching pembayaran
  const {
    data: pembayaranData,
    isLoading: isLoadingPembayaran,
    error: errorPembayaran,
  } = usePembayarans(pembayaranQueryParams);

  const pembayaran = React.useMemo(() => {
    const pembayarans = (pembayaranData?.data || []) as Pembayaran[];
    return pembayarans.length > 0 ? pembayarans[0] : null;
  }, [pembayaranData]);

  // Event handlers
  const handleBackToList = () => {
    router.back();
  };

  const handlePrintThermal = (widthMm: 80 | 58) => {
    const pengupasan = pengupasanData?.data;
    if (!pengupasan) return;
    const html = buildPengupasanNotaDocument({
      pengupasan,
      pembayaran,
      widthMm,
      autoPrint: false,
    });
    openPrintPreviewDocument(html, {
      title: `Preview Nota - Pengupasan ${widthMm}mm`,
    });
  };

  const handlePrintA4 = () => {
    const pengupasan = pengupasanData?.data;
    if (!pengupasan) return;
    const html = buildPengupasanA4Document({
      pengupasan,
      pembayaran,
      autoPrint: false,
    });
    openPrintPreviewDocument(html, { title: "Preview A4 - Pengupasan" });
  };

  // Loading & Error states
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !pengupasanData?.data) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error?.message || "Gagal memuat data pengupasan"}
        </div>
        <Button onClick={handleBackToList} className="mt-4">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const pengupasan = pengupasanData.data;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header dengan back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-2xl font-bold">Detail Pengupasan</h1>
            <p className="text-sm text-muted-foreground">
              {pengupasan.invoice || `ID: ${pengupasan.id}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleBackToList} className="text-xs sm:text-sm">
            <ArrowLeft className="size-4 mr-1.5 sm:mr-2" />
            Kembali
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Printer className="size-4 mr-2" />
                Print
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handlePrintThermal(80)}>
                <Printer className="size-4 mr-2" />
                Print Thermal 80mm (ESC)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrintThermal(58)}>
                <Printer className="size-4 mr-2" />
                Print Thermal 58mm (ESC)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintA4}>
                <Printer className="size-4 mr-2" />
                Print A4
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informasi Utama */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Informasi Utama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice</p>
                <p className="font-mono font-medium">
                  {pengupasan.invoice || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    pengupasan.status === "SELESAI"
                      ? "default"
                      : pengupasan.status === "DIBATALKAN"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {pengupasan.status === "MENUNGGU_APPROVAL" ? "Menunggu Approval Owner" : pengupasan.status}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Pekerja</p>
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="font-medium">
                  {pengupasan.pekerja?.nama || "-"}
                </span>
                {pengupasan.pekerja?.telepon && (
                  <span className="text-sm text-muted-foreground">
                    ({pengupasan.pekerja.telepon})
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>
                    {pengupasan.tanggal_mulai
                      ? formatDateTime(pengupasan.tanggal_mulai)
                      : "-"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Selesai</p>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>
                    {pengupasan.tanggal_selesai
                      ? formatDateTime(pengupasan.tanggal_selesai)
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {(pengupasan.createdBy || pengupasan.confirmedBy) && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  {pengupasan.createdBy && (
                    <div>
                      <p className="text-sm text-muted-foreground">Dibuat Oleh</p>
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {pengupasan.createdBy.nama}
                        </span>
                      </div>
                    </div>
                  )}
                  {pengupasan.confirmedBy && (
                    <div>
                      <p className="text-sm text-muted-foreground">Dikonfirmasi Oleh</p>
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {pengupasan.confirmedBy.nama}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Informasi Produk & Upah */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Produk & Upah
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Input Produk</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">Kemiri Kering</span>
                <span className="text-muted-foreground">
                  {Number(pengupasan.produkJumlah).toLocaleString("id-ID")} kg
                </span>
              </div>
            </div>

            <Separator />

            {(pengupasan.kemiri_campur_jumlah !== null &&
              pengupasan.kemiri_campur_jumlah !== undefined) ||
              (pengupasan.kemiri_cangkang_jumlah !== null &&
                pengupasan.kemiri_cangkang_jumlah !== undefined) ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Output Produk</p>
                  <div className="space-y-2">
                    {pengupasan.kemiri_campur_jumlah !== null &&
                      pengupasan.kemiri_campur_jumlah !== undefined && (
                        <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="font-medium">Kemiri Campur</span>
                          <span className="text-muted-foreground">
                            {formatDecimal(Number(pengupasan.kemiri_campur_jumlah))} kg
                          </span>
                        </div>
                      )}
                    {pengupasan.kemiri_cangkang_jumlah !== null &&
                      pengupasan.kemiri_cangkang_jumlah !== undefined && (
                        <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="font-medium">Kemiri Cangkang</span>
                          <span className="text-muted-foreground">
                            {formatDecimal(Number(pengupasan.kemiri_cangkang_jumlah))} kg
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                <Separator />
              </>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Upah Satuan</p>
                <p className="font-semibold">
                  {formatCurrency(pengupasan.upah_satuan)} / kg
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Upah</p>
                <p className="font-semibold text-lg">
                  {pengupasan.total_upah
                    ? formatCurrency(pengupasan.total_upah)
                    : "-"}
                </p>
              </div>
            </div>

            {pengupasan.catatan && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Catatan</p>
                  <p className="text-sm">{pengupasan.catatan}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pembayaran */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Pembayaran
            </CardTitle>
            {pembayaran && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/pembayaran/${pembayaran.id}`)}
              >
                <ExternalLink className="size-4 mr-2" />
                Lihat Detail
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPembayaran ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : errorPembayaran ? (
            <div className="text-destructive p-4 text-sm">
              Error: {errorPembayaran.message || "Gagal memuat data pembayaran"}
            </div>
          ) : !pembayaran ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Belum ada pembayaran
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Invoice Pembayaran</p>
                  <div className="flex items-center gap-2">
                    <Receipt className="size-4 text-muted-foreground" />
                    <span className="font-mono font-medium">{pembayaran.invoice}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(pembayaran.total)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Arus</p>
                  <Badge
                    variant={pembayaran.arus === "MASUK" ? "default" : "destructive"}
                    className={pembayaran.arus === "MASUK" ? "bg-green-500" : "bg-red-500 text-white"}
                  >
                    {pembayaran.arus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Metode Pembayaran</p>
                  <Badge variant="outline">
                    {pembayaran.isCashless ? "Cashless" : "Tunai"}
                  </Badge>
                </div>
              </div>

              {pembayaran.rekening && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rekening Sumber</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{pembayaran.rekening.bank}</div>
                        <div className="text-sm text-muted-foreground">{pembayaran.rekening.nama}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {pembayaran.catatan && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Catatan</p>
                    <p className="text-sm">{pembayaran.catatan}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Tanggal Pembayaran</p>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>
                    {pembayaran.createdAt
                      ? formatDateTime(pembayaran.createdAt)
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
