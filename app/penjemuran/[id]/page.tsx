"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePenjemuran } from "@/hooks/usePenjemurans";
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
import { buildPenjemuranNotaDocument } from "@/print/templates/penjemuranNota";
import { buildPenjemuranA4Document } from "@/print/templates/penjemuranA4";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PenjemuranDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Fetch penjemuran data
  const { data: penjemuranData, isLoading, error } = usePenjemuran(id);

  // Build query params untuk pembayaran (hanya 1 pembayaran)
  const pembayaranQueryParams = useTableQuery<GetPembayaransParams>({
    pagination: { pageIndex: 0, pageSize: 1 },
    filters: {},
    buildParams: () => ({
      page: 1,
      limit: 1,
      sumberType: "PENJEMURAN",
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

  const handlePrint = (widthMm: 80 | 58 = 80) => {
    const penjemuran = penjemuranData?.data;
    if (!penjemuran) return;

    const html = buildPenjemuranNotaDocument({
      penjemuran,
      pembayaran,
      widthMm,
      autoPrint: false,
    });

    openPrintPreviewDocument(html, { title: `Preview Nota - Penjemuran ${widthMm}mm` });
  };

  const handlePrintA4 = () => {
    const penjemuran = penjemuranData?.data;
    if (!penjemuran) return;

    const html = buildPenjemuranA4Document({
      penjemuran,
      pembayaran,
      autoPrint: false,
    });

    openPrintPreviewDocument(html, { title: "Preview A4 - Penjemuran" });
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

  if (error || !penjemuranData?.data) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error?.message || "Gagal memuat data penjemuran"}
        </div>
        <Button onClick={handleBackToList} className="mt-4">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const penjemuran = penjemuranData.data;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header dengan back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
         
          <div>
            <h1 className="text-2xl font-bold">Detail Penjemuran</h1>
            <p className="text-sm text-muted-foreground">
              {penjemuran.invoice || `ID: ${penjemuran.id}`}
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
              <DropdownMenuItem onClick={() => handlePrint(80)}>
                <Printer className="size-4 mr-2" />
                Print Thermal 80mm (ESC)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrint(58)}>
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
                  {penjemuran.invoice || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    penjemuran.status === "SELESAI"
                      ? "default"
                      : penjemuran.status === "DIBATALKAN"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {penjemuran.status === "MENUNGGU_APPROVAL" ? "Menunggu Approval Owner" : penjemuran.status}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Pekerja</p>
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="font-medium">
                  {penjemuran.pekerja?.nama || "-"}
                </span>
                {penjemuran.pekerja?.telepon && (
                  <span className="text-sm text-muted-foreground">
                    ({penjemuran.pekerja.telepon})
                  </span>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Jumlah Produk Input</p>
              <div className="flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                <span className="font-medium">
                  {Number(penjemuran.produkJumlah).toLocaleString("id-ID")} kg
                </span>
                <span className="text-sm text-muted-foreground">(Kemiri Gaba)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>
                    {penjemuran.tanggal_mulai
                      ? formatDateTime(penjemuran.tanggal_mulai)
                      : "-"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Selesai</p>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>
                    {penjemuran.tanggal_selesai
                      ? formatDateTime(penjemuran.tanggal_selesai)
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
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
              <p className="text-sm text-muted-foreground mb-2">Jumlah Produk Input</p>
              <div className="flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                <span className="font-medium">
                  {Number(penjemuran.produkJumlah).toLocaleString("id-ID")} kg
                </span>
                <span className="text-sm text-muted-foreground">(Kemiri Gaba)</span>
              </div>
            </div>

            <Separator />

            {(penjemuran.susut_jumlah !== null &&
              penjemuran.susut_jumlah !== undefined) ||
            (penjemuran.susut_percentage !== null &&
              penjemuran.susut_percentage !== undefined) ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Susut</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Jumlah</p>
                      <p className="font-semibold">
                        {penjemuran.susut_jumlah !== null &&
                        penjemuran.susut_jumlah !== undefined
                          ? `${formatDecimal(Number(penjemuran.susut_jumlah))} kg`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Persentase</p>
                      <p className="font-semibold">
                        {penjemuran.susut_percentage !== null &&
                        penjemuran.susut_percentage !== undefined
                          ? `${formatDecimal(Number(penjemuran.susut_percentage))}%`
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />
              </>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Upah Satuan</p>
                <p className="font-semibold">
                  {formatCurrency(penjemuran.upah_satuan)} / kg
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Upah</p>
                <p className="font-semibold text-lg">
                  {penjemuran.total_upah
                    ? formatCurrency(penjemuran.total_upah)
                    : "-"}
                </p>
              </div>
            </div>

            {penjemuran.catatan && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Catatan</p>
                  <p className="text-sm">{penjemuran.catatan}</p>
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
                    className={pembayaran.arus === "MASUK" ? "bg-green-500 text-white" : "bg-red-500 text-white"}
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
