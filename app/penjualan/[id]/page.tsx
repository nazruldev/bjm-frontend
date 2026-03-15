"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePenjualan } from "@/hooks/usePenjualans";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, User, Printer, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { openPrintPreviewDocument } from "@/print/openPrintPreview";
import { buildInvoicePenjualanA4Document } from "@/print/templates/invoicePenjualanA4";

export default function PenjualanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const penjualanId = params.id as string;

  const { data: penjualanData, isLoading, error } = usePenjualan(penjualanId);

  const handleBack = () => router.back();
  const handleCetakInvoice = () => {
    const html = buildInvoicePenjualanA4Document({
      penjualan: penjualan as any,
      autoPrint: false,
    });
    openPrintPreviewDocument(html, { title: `Invoice ${penjualan.invoice}` });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !penjualanData) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error?.message || "Gagal memuat data penjualan"}
        </div>
        <Button onClick={handleBack} className="mt-4">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const penjualan = penjualanData;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="size-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Penjualan</h1>
            <p className="text-sm text-muted-foreground">{penjualan.invoice}</p>
          </div>
        </div>
        <Button onClick={handleCetakInvoice} variant="outline" size="sm">
          <Printer className="size-4 mr-2" />
          Cetak Invoice
        </Button>
        {!penjualan.pengiriman && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/pengiriman?penjualanId=${encodeURIComponent(penjualan.id)}`)}
          >
            <Truck className="size-4 mr-2" />
            Tambah Pengiriman
          </Button>
        )}
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
                <p className="font-mono font-medium">{penjualan.invoice}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal</p>
                <p className="font-medium">
                  {penjualan.createdAt
                    ? formatDateTime(penjualan.createdAt)
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pelanggan</p>
                <p className="font-medium">{penjualan.pelanggan?.nama ?? "Walk-in"}</p>
              </div>
              {penjualan.pelanggan?.telepon && (
                <div>
                  <p className="text-sm text-muted-foreground">Telepon</p>
                  <p className="font-medium">{penjualan.pelanggan.telepon}</p>
                </div>
              )}
              {penjualan.pelanggan?.alamat && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Alamat</p>
                  <p className="font-medium text-sm">{penjualan.pelanggan.alamat}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Outlet</p>
                <p className="font-medium">{penjualan.outlet?.nama ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dibuat Oleh</p>
                <p className="font-medium flex items-center gap-1">
                  <User className="size-4" />
                  {penjualan.createdBy?.nama ?? "-"}
                </p>
              </div>
            </div>
            {penjualan.catatan && (
              <div>
                <p className="text-sm text-muted-foreground">Catatan</p>
                <p className="text-sm">{penjualan.catatan}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {penjualan.biayaKirim != null && Number(penjualan.biayaKirim) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Biaya kirim</span>
                <span>{formatCurrency(Number(penjualan.biayaKirim))}</span>
              </div>
            )}
            <p className="text-2xl font-bold">
              {formatCurrency(Number(penjualan.total))}
            </p>
          </CardContent>
        </Card>
      </div>

      {penjualan.pengiriman && (
        <Card>
          <CardHeader>
            <CardTitle>Pengiriman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{penjualan.pengiriman.status}</p>
              </div>
              {penjualan.pengiriman.alamatKirim && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Alamat kirim</p>
                  <p className="font-medium">{penjualan.pengiriman.alamatKirim}</p>
                </div>
              )}
              {penjualan.pengiriman.namaKurir && (
                <div>
                  <p className="text-muted-foreground">Kurir</p>
                  <p className="font-medium">{penjualan.pengiriman.namaKurir}</p>
                </div>
              )}
              {penjualan.pengiriman.namaPenerima && (
                <div>
                  <p className="text-muted-foreground">Penerima</p>
                  <p className="font-medium">{penjualan.pengiriman.namaPenerima}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detail Item</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(penjualan.detail || []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.produk?.nama_produk ?? "-"}
                  </TableCell>
                  <TableCell>{item.produk?.satuan ?? "-"}</TableCell>
                  <TableCell className="text-right">{item.jumlah}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.harga)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
