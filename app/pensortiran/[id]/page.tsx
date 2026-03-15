"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePensortiran } from "@/hooks/usePensortirans";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  User,
  Package,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { formatDate, formatDateTime, formatDecimal } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { openPrintPreviewDocument } from "@/print/openPrintPreview";
import { buildPensortiranNotaDocument } from "@/print/templates/pensortiranNota";
import { buildPensortiranA4Document } from "@/print/templates/pensortiranA4";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PensortiranDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: pensortiranData, isLoading, error } = usePensortiran(id);

  const handleBackToList = () => {
    router.back();
  };

  const handlePrintThermal = (widthMm: 80 | 58) => {
    const pensortiran = pensortiranData?.data;
    if (!pensortiran) return;
    const html = buildPensortiranNotaDocument({
      pensortiran,
      widthMm,
      autoPrint: false,
    });
    openPrintPreviewDocument(html, {
      title: `Preview Nota - Pensortiran ${widthMm}mm`,
    });
  };

  const handlePrintA4 = () => {
    const pensortiran = pensortiranData?.data;
    if (!pensortiran) return;
    const html = buildPensortiranA4Document({
      pensortiran,
      autoPrint: false,
    });
    openPrintPreviewDocument(html, { title: "Preview A4 - Pensortiran" });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !pensortiranData?.data) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error?.message || "Gagal memuat data pensortiran"}
        </div>
        <Button onClick={handleBackToList} className="mt-4">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const pensortiran = pensortiranData.data;
  const totalHasil =
    Number(pensortiran.jumlah_menir || 0) +
    Number(pensortiran.jumlah_abu || 0) +
    Number(pensortiran.jumlah_keping || 0) +
    Number(pensortiran.jumlah_bulat || 0) +
    Number(pensortiran.jumlah_busuk || 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
         
          <div>
            <h1 className="text-2xl font-bold">Detail Pensortiran</h1>
            <p className="text-sm text-muted-foreground">
              {pensortiran.invoice || `ID: ${pensortiran.id}`}
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
          <Badge
            variant={
              pensortiran.status === "SELESAI"
                ? "default"
                : pensortiran.status === "DIBATALKAN"
                  ? "destructive"
                  : "secondary"
            }
            className={
              pensortiran.status === "SELESAI"
                ? "bg-green-500"
                : pensortiran.status === "DIBATALKAN"
                  ? "bg-red-500"
                  : "bg-yellow-500"
            }
          >
            {pensortiran.status === "SELESAI" ? (
              <CheckCircle2 className="size-3 mr-1" />
            ) : pensortiran.status === "DIBATALKAN" ? (
              <XCircle className="size-3 mr-1" />
            ) : (
              <Clock className="size-3 mr-1" />
            )}
            {pensortiran.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  {pensortiran.invoice || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    pensortiran.status === "SELESAI"
                      ? "default"
                      : pensortiran.status === "DIBATALKAN"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {pensortiran.status}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Inspector</p>
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="font-medium">
                  {pensortiran.inspector?.nama || "-"}
                </span>
                {pensortiran.inspector?.email && (
                  <span className="text-sm text-muted-foreground">
                    ({pensortiran.inspector.email})
                  </span>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Jumlah Input</p>
              <div className="flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                <span className="font-medium">
                  {Number(pensortiran.produkJumlah).toLocaleString("id-ID")} kg
                </span>
                <span className="text-sm text-muted-foreground">
                  (Kemiri Campur)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>
                    {pensortiran.tanggal_mulai
                      ? formatDateTime(pensortiran.tanggal_mulai)
                      : "-"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Selesai</p>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>
                    {pensortiran.tanggal_selesai
                      ? formatDateTime(pensortiran.tanggal_selesai)
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Hasil Sortir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Jumlah Input (Kemiri Campur)
              </p>
              <p className="font-medium">
                {Number(pensortiran.produkJumlah).toLocaleString("id-ID")} kg
              </p>
            </div>

            <Separator />

            {pensortiran.status === "SELESAI" ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Detail Hasil
                  </p>
                  <div className="space-y-2">
                    {pensortiran.jumlah_menir != null &&
                      Number(pensortiran.jumlah_menir) > 0 && (
                        <div className="flex justify-between p-2 bg-muted rounded">
                          <span>Menir</span>
                          <span>
                            {formatDecimal(Number(pensortiran.jumlah_menir))} kg
                          </span>
                        </div>
                      )}
                    {pensortiran.jumlah_abu != null &&
                      Number(pensortiran.jumlah_abu) > 0 && (
                        <div className="flex justify-between p-2 bg-muted rounded">
                          <span>Abu</span>
                          <span>
                            {formatDecimal(Number(pensortiran.jumlah_abu))} kg
                          </span>
                        </div>
                      )}
                    {pensortiran.jumlah_keping != null &&
                      Number(pensortiran.jumlah_keping) > 0 && (
                        <div className="flex justify-between p-2 bg-muted rounded">
                          <span>Keping</span>
                          <span>
                            {formatDecimal(Number(pensortiran.jumlah_keping))} kg
                          </span>
                        </div>
                      )}
                    {pensortiran.jumlah_bulat != null &&
                      Number(pensortiran.jumlah_bulat) > 0 && (
                        <div className="flex justify-between p-2 bg-muted rounded">
                          <span>Bulat</span>
                          <span>
                            {formatDecimal(Number(pensortiran.jumlah_bulat))} kg
                          </span>
                        </div>
                      )}
                    {pensortiran.jumlah_busuk != null &&
                      Number(pensortiran.jumlah_busuk) > 0 && (
                        <div className="flex justify-between p-2 bg-muted rounded">
                          <span>Busuk (tidak masuk stok)</span>
                          <span>
                            {formatDecimal(Number(pensortiran.jumlah_busuk))} kg
                          </span>
                        </div>
                      )}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Total Hasil</p>
                  <p className="font-semibold text-lg">
                    {formatDecimal(totalHasil)} kg
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Hasil sortir akan tampil setelah dikonfirmasi.
              </p>
            )}

            {pensortiran.catatan && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Catatan</p>
                  <p className="text-sm">{pensortiran.catatan}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
