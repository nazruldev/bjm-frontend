"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePembayaran } from "@/hooks/usePembayarans";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt, Calendar, CreditCard, FileText, ExternalLink, Printer } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function PembayaranDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  // Data fetching
  const {
    data: pembayaranData,
    isLoading,
    error,
  } = usePembayaran(id);

  const pembayaran = pembayaranData?.data;

  // Event handlers
  const handleBackToList = () => {
    router.back();
  };

  const handlePrint = () => {
    window.print();
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

  const getSumberStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "LUNAS":
      case "SELESAI":
        return "default";
      case "AKTIF":
      case "BERJALAN":
        return "secondary";
      case "PARTIAL":
        return "outline";
      default:
        return "destructive";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat detail pembayaran"}
        </div>
        <Button onClick={handleBackToList} className="mt-4">
          <ArrowLeft className="mr-2 size-4" />
          Kembali ke List
        </Button>
      </div>
    );
  }

  // No data
  if (!pembayaran) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Data pembayaran tidak ditemukan</div>
        <Button onClick={handleBackToList} className="mt-4">
          <ArrowLeft className="mr-2 size-4" />
          Kembali ke List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Detail Pembayaran</h1>
          <p className="text-muted-foreground">
            Invoice: {pembayaran.invoice}
          </p>
        </div>
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

      {/* Main Detail Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-5" />
              Informasi Pembayaran
            </CardTitle>
            {getArusBadge(pembayaran.arus)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          
          {/* Invoice Pembayaran */}
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="size-4" />
              Invoice Pembayaran
            </div>
            <div className="font-mono font-medium">{pembayaran.invoice}</div>
          </div>

          <Separator />

          {/* Sumber Invoice */}
          {pembayaran.sumberInvoice ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Sumber Invoice</div>
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{pembayaran.sumberInvoice.type === "PENGELUARAN" ? "KEUANGAN" : pembayaran.sumberInvoice.type}</Badge>
                      <span className="font-mono font-medium text-sm">
                        {pembayaran.sumberInvoice.invoice || `ID: ${pembayaran.sumberInvoice.id}`}
                      </span>
                    </div>
                    {pembayaran.sumberInvoice.status && (
                      <Badge variant={getSumberStatusVariant(pembayaran.sumberInvoice.status)}>
                        {pembayaran.sumberInvoice.status}
                      </Badge>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Total</div>
                      <div className="font-semibold">{formatCurrency(pembayaran.sumberInvoice.total)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Dibayar</div>
                      <div className="font-semibold">{formatCurrency(pembayaran.sumberInvoice.dibayar)}</div>
                    </div>
                  </div>

                  <Separator />
                  {pembayaran.sumberInvoice.type !== "PENGELUARAN" && (
                    <div className="flex items-center justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          if (!pembayaran.sumberInvoice?.id) return;
                          const sourceType = pembayaran.sumberInvoice.type;
                          const sourceId = pembayaran.sumberInvoice.id;
                          if (sourceType === "PIUTANG" || sourceType === "HUTANG") {
                            if (pembayaran.sumberInvoice.subjekType && pembayaran.sumberInvoice.subjekId) {
                              const route = sourceType === "PIUTANG" ? "/piutang" : "/hutang";
                              router.push(`${route}/${pembayaran.sumberInvoice.subjekId}-${pembayaran.sumberInvoice.subjekType}/${sourceId}`);
                            }
                          } else if (sourceType === "PENJEMURAN") {
                            router.push(`/penjemuran/${sourceId}`);
                          } else if (sourceType === "PEMBELIAN") {
                            router.push(`/pembelian/${sourceId}`);
                          } else if (sourceType === "PENGUPASAN") {
                            router.push(`/pengupasan/${sourceId}`);
                          } else if (sourceType === "PENJUALAN") {
                            router.push(`/penjualan/${sourceId}`);
                          } else if (sourceType === "PENGGAJIAN") {
                            router.push(`/penggajian/${sourceId}`);
                          }
                        }}
                      >
                        <ExternalLink className="size-3 mr-1" />
                        Lihat Detail Sumber
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Sumber Invoice</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{pembayaran.sumberType === "PENGELUARAN" ? "KEUANGAN" : pembayaran.sumberType}</Badge>
                  {pembayaran.sumberId && (
                    <span className="font-mono text-sm">{pembayaran.sumberId}</span>
                  )}
                </div>
                {pembayaran.sumberId && pembayaran.sumberType !== "PENGELUARAN" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      const sourceType = pembayaran.sumberType;
                      const sourceId = pembayaran.sumberId;
                      if (!sourceId) return;
                      if (sourceType === "PENJEMURAN") {
                        router.push(`/penjemuran/${sourceId}`);
                      } else if (sourceType === "PEMBELIAN") {
                        router.push(`/pembelian/${sourceId}`);
                      } else if (sourceType === "PENGUPASAN") {
                        router.push(`/pengupasan/${sourceId}`);
                      } else if (sourceType === "PENJUALAN") {
                        router.push(`/penjualan/${sourceId}`);
                      } else if (sourceType === "PENGGAJIAN") {
                        router.push(`/penggajian/${sourceId}`);
                      }
                    }}
                  >
                    <ExternalLink className="size-3 mr-1" />
                    Lihat Detail Sumber
                  </Button>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Total & Tanggal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Total
              </div>
              <div className="text-xl font-bold">
                {formatCurrency(pembayaran.total)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="size-4" />
                Tanggal
              </div>
              <div className="text-lg">
                {formatDateTime(pembayaran.createdAt)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Metode Pembayaran */}
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="size-4" />
              Metode Pembayaran
            </div>
            <div className="flex items-center gap-2">
              {pembayaran.isCashless ? (
                <>
                  <Badge variant="outline">Cashless</Badge>
                  {pembayaran.rekening && (
                    <span className="text-sm text-muted-foreground">
                      {pembayaran.rekening.bank} - {pembayaran.rekening.nama}
                      {pembayaran.rekening.nomor && ` (${pembayaran.rekening.nomor})`}
                    </span>
                  )}
                </>
              ) : (
                <Badge variant="outline">Tunai</Badge>
              )}
            </div>
          </div>

          {/* Catatan */}
          {pembayaran.catatan && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Catatan</div>
                <p className="text-sm">{pembayaran.catatan}</p>
              </div>
            </>
          )}

          {/* Tanggal, Bulan, Tahun */}
          {(pembayaran.tanggal || pembayaran.bulan || pembayaran.tahun) && (
            <>
              <Separator />
              <div className="grid grid-cols-3 gap-4">
                {pembayaran.tanggal && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Tanggal</div>
                    <div className="text-lg font-semibold">{pembayaran.tanggal}</div>
                  </div>
                )}
                {pembayaran.bulan && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Bulan</div>
                    <div className="text-lg font-semibold">{pembayaran.bulan}</div>
                  </div>
                )}
                {pembayaran.tahun && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Tahun</div>
                    <div className="text-lg font-semibold">{pembayaran.tahun}</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Dilakukan oleh */}
          <Separator />
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Dilakukan oleh</div>
            <div className="text-sm font-medium">{pembayaran.createdBy?.nama ?? "-"}</div>
          </div>

          {/* Info Tambahan */}
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Created At</div>
              <div>{formatDateTime(pembayaran.createdAt)}</div>
            </div>
            {pembayaran.updatedAt && (
              <div className="space-y-1">
                <div className="text-muted-foreground">Updated At</div>
                <div>{formatDateTime(pembayaran.updatedAt)}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

