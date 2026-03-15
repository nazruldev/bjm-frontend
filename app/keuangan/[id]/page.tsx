"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useKeuangan } from "@/hooks/useKeuangans";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, User, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { openPrintPreviewDocument } from "@/print/openPrintPreview";
import { buildKeuanganNotaDocument } from "@/print/templates/keuanganNota";
import { buildKeuanganA4Document } from "@/print/templates/keuanganA4";

export default function KeuanganDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: keuanganResponse, isLoading, error } = useKeuangan(id);
  const keuangan = keuanganResponse?.data;

  const handleBackToList = () => router.back();
  const handlePrintThermal = (widthMm: 80 | 58) => {
    if (!keuangan) return;
    openPrintPreviewDocument(buildKeuanganNotaDocument({ keuangan, widthMm, autoPrint: false }), { title: `Preview Nota - Keuangan ${widthMm}mm` });
  };
  const handlePrintA4 = () => {
    if (!keuangan) return;
    openPrintPreviewDocument(buildKeuanganA4Document({ keuangan, autoPrint: false }), { title: "Preview A4 - Keuangan" });
  };

  if (isLoading) return <div className="p-4 space-y-4"><Skeleton className="h-10 w-32" /><Skeleton className="h-64 w-full" /></div>;
  if (error || !keuangan) return <div className="p-4"><div className="text-destructive">{error?.message || "Gagal memuat data keuangan"}</div><Button onClick={handleBackToList} className="mt-4">Kembali ke Daftar</Button></div>;

  const arus = keuangan.arus ?? "KELUAR";
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Detail Keuangan</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{keuangan.invoice}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={handleBackToList}><ArrowLeft className="size-4 mr-1.5 sm:mr-2" />Kembali</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Printer className="size-4 mr-1.5 sm:mr-2" />Print</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handlePrintThermal(80)}><Printer className="size-4 mr-2" />Thermal 80mm</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrintThermal(58)}><Printer className="size-4 mr-2" />Thermal 58mm</DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintA4}><Printer className="size-4 mr-2" />Print A4</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-3 sm:p-6"><CardTitle className="flex items-center gap-2 text-base sm:text-lg"><FileText className="size-4 sm:size-5" />Informasi</CardTitle></CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div><p className="text-xs sm:text-sm text-muted-foreground">Tipe</p><p className="font-medium text-sm sm:text-base">{arus === "MASUK" ? "Masuk " : "Keluar"}</p></div>
              <div><p className="text-xs sm:text-sm text-muted-foreground">Status Pembayaran</p>{(() => { const s = keuangan.statusPembayaran ?? "LUNAS"; const label = s === "LUNAS" ? "Selesai" : s === "MENUNGGU_APPROVAL" ? "Menunggu Approval" : "Ditolak"; const variant = s === "LUNAS" ? "default" : s === "MENUNGGU_APPROVAL" ? "secondary" : "destructive"; return <Badge variant={variant} className="mt-1">{label}</Badge>; })()}</div>
              <div><p className="text-xs sm:text-sm text-muted-foreground">Metode Pembayaran</p><Badge variant={keuangan.isCashless ? "secondary" : "outline"} className="mt-1">{keuangan.isCashless ? "Cashless" : "Tunai"}</Badge></div>
              <div><p className="text-xs sm:text-sm text-muted-foreground">Invoice</p><p className="font-mono font-medium text-sm sm:text-base truncate">{keuangan.invoice}</p></div>
              <div><p className="text-xs sm:text-sm text-muted-foreground">Tanggal</p><p className="font-medium text-sm sm:text-base">{keuangan.createdAt ? formatDateTime(keuangan.createdAt) : "-"}</p></div>
            </div>
            {keuangan.createdBy && <div><p className="text-xs sm:text-sm text-muted-foreground mb-1">Dibuat Oleh</p><div className="flex items-center gap-2"><User className="size-4 text-muted-foreground shrink-0" /><div><p className="font-medium text-sm sm:text-base truncate">{keuangan.createdBy.nama}</p>{keuangan.createdBy.email && <p className="text-xs text-muted-foreground truncate">{keuangan.createdBy.email}</p>}</div></div></div>}
            {keuangan.catatan?.trim() && <div><p className="text-xs sm:text-sm text-muted-foreground mb-1">Catatan</p><p className="text-xs sm:text-sm whitespace-pre-wrap">{keuangan.catatan.trim()}</p></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6"><CardTitle className="text-base sm:text-lg">Jumlah</CardTitle></CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <p className={arus === "MASUK" ? "text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums" : "text-2xl sm:text-3xl font-bold text-destructive tabular-nums"}>
              {arus === "MASUK" ? "+" : ""}{formatCurrency(Number(keuangan.total))}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
