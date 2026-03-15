"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePembelian } from "@/hooks/usePembelians";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, FileText, User, ExternalLink, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { openPrintPreviewDocument } from "@/print/openPrintPreview";
import { buildPembelianNotaDocument } from "@/print/templates/pembelianNota";
import { buildPembelianA4Document } from "@/print/templates/pembelianA4";

export default function PembelianDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pembelianId = params.id as string;

  // Fetch pembelian data
  const { data: pembelianData, isLoading, error } = usePembelian(pembelianId);

  const handleBackToList = () => {
    router.back();
  };

  const handlePrint = (widthMm: 80 | 58 = 80) => {
    if (!pembelianData) return;
    const html = buildPembelianNotaDocument({
      pembelian: pembelianData,
      widthMm,
      autoPrint: false,
    });
    openPrintPreviewDocument(html, { title: `Preview Nota - Pembelian ${widthMm}mm` });
  };

  const handlePrintA4 = () => {
    if (!pembelianData) return;
    const html = buildPembelianA4Document({
      pembelian: pembelianData,
      autoPrint: false,
    });
    openPrintPreviewDocument(html, { title: "Preview A4 - Pembelian" });
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

  if (error || !pembelianData) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error?.message || "Gagal memuat data pembelian"}
        </div>
        <Button onClick={handleBackToList} className="mt-4">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const pembelian = pembelianData;

  // Additional safety check
  if (!pembelian || !pembelian.createdAt) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: Data pembelian tidak lengkap
        </div>
        <Button onClick={handleBackToList} className="mt-4">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Detail Pembelian</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {pembelian.invoice}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={handleBackToList} className="text-xs sm:text-sm">
            <ArrowLeft className="size-4 mr-1.5 sm:mr-2" />
            Kembali
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Printer className="size-4 mr-1.5 sm:mr-2" />
                Print
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handlePrint(80)} className="whitespace-nowrap">
                <Printer className="size-4 mr-2" />
                80mm (ESC)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrint(58)} className="whitespace-nowrap">
                <Printer className="size-4 mr-2" />
                58mm (ESC)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintA4} className="whitespace-nowrap">
                <Printer className="size-4 mr-2" />
                Print A4
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Informasi Utama */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="size-4 sm:size-5" />
              Informasi Utama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Invoice</p>
                <p className="font-mono font-medium text-sm sm:text-base truncate">{pembelian.invoice}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Tanggal</p>
                <p className="font-medium text-sm sm:text-base">
                  {pembelian.createdAt
                    ? formatDateTime(pembelian.createdAt)
                    : "-"}
                </p>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Status Pembayaran</p>
              {(() => {
                const status = pembelian.statusPembayaran ?? "LUNAS";
                const label =
                  status === "LUNAS"
                    ? "Selesai"
                    : status === "MENUNGGU_APPROVAL"
                      ? "Menunggu Approval"
                      : "Ditolak";
                const variant =
                  status === "LUNAS"
                    ? "default"
                    : status === "MENUNGGU_APPROVAL"
                      ? "secondary"
                      : "destructive";
                return <Badge variant={variant} className="mt-1">{label}</Badge>;
              })()}
            </div>
            {pembelian.pemasok && (
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Pemasok</p>
                <div className="flex items-center gap-2 min-w-0">
                  <User className="size-4 text-muted-foreground shrink-0" />
                  <p className="font-medium text-sm sm:text-base truncate">{pembelian.pemasok.nama}</p>
                </div>
                {pembelian.pemasok.telepon && (
                  <p className="text-xs sm:text-sm text-muted-foreground ml-6 break-all">
                    {pembelian.pemasok.telepon}
                  </p>
                )}
                {pembelian.pemasok.alamat && (
                  <p className="text-xs sm:text-sm text-muted-foreground ml-6 wrap-break-word">
                    {pembelian.pemasok.alamat}
                  </p>
                )}
              </div>
            )}
            {!pembelian.pemasok && (
              <div>
                <p className="text-sm text-muted-foreground">Pemasok</p>
                <Badge variant="outline">Walk-in</Badge>
              </div>
            )}
            {pembelian.createdBy && (
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Dibuat Oleh</p>
                <p className="font-medium text-sm sm:text-base truncate">{pembelian.createdBy.nama}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {pembelian.createdBy.email}
                </p>
              </div>
            )}
            {pembelian.catatan && (
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Catatan</p>
                <p className="text-xs sm:text-sm whitespace-pre-wrap wrap-break-word">{pembelian.catatan}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total & Summary */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Pembelian</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums truncate">
                {formatCurrency(Number(pembelian.total))}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Jumlah Item</p>
              <p className="text-lg sm:text-xl font-semibold">
                {pembelian.detail?.length || 0} item
              </p>
            </div>
            {pembelian.mutasiStok && pembelian.mutasiStok.length > 0 && (
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Mutasi Stok</p>
                <div className="space-y-1">
                  {pembelian.mutasiStok.map((mutasi: any) => (
                    <div key={mutasi.id} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                      <span className="truncate">{mutasi.produk?.nama_produk || "-"}</span>
                      <Badge variant="default" className="shrink-0">+{Number(mutasi.jumlah)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pembelian.pembayaran && pembelian.pembayaran.length > 0 && (
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Pembayaran</p>
                <div className="space-y-2">
                  {pembelian.pembayaran.map((pembayaran: any) => (
                    <div
                      key={pembayaran.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 bg-muted rounded"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{pembayaran.invoice}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {pembayaran.createdAt
                            ? formatDateTime(pembayaran.createdAt)
                            : "-"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                        <p className="text-xs sm:text-sm font-semibold tabular-nums">
                          {formatCurrency(Number(pembayaran.total))}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => router.push(`/pembayaran/${pembayaran.id}`)}
                        >
                          <ExternalLink className="size-3 mr-1" />
                          Detail
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Pembelian */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="size-4 sm:size-5" />
            Detail Pembelian
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Produk</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Jumlah</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Harga</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pembelian.detail && pembelian.detail.length > 0 ? (
                  pembelian.detail.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2 sm:py-4">
                        <div className="min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">
                            {item.produk?.nama_produk || "-"}
                          </p>
                          <p className="text-[10px] sm:text-sm text-muted-foreground">
                            {item.produk?.satuan || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm tabular-nums py-2 sm:py-4">
                        {Number(item.jumlah).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm tabular-nums py-2 sm:py-4">
                        {item.harga
                          ? formatCurrency(Number(item.harga))
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm font-semibold tabular-nums py-2 sm:py-4">
                        {formatCurrency(Number(item.subtotal))}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground text-xs sm:text-sm py-6">
                      Tidak ada detail pembelian
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}



