"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePengiriman, useUpdatePengiriman } from "@/hooks/usePengiriman";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import dayjs from "@/lib/dayjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { penjualanService } from "@/services/penjualanService";
import { openPrintPreviewDocument } from "@/print/openPrintPreview";
import { buildInvoicePenjualanA4Document } from "@/print/templates/invoicePenjualanA4";

const STATUS_OPTIONS = [
  { value: "MENUNGGU", label: "Menunggu" },
  { value: "DALAM_PENGIRIMAN", label: "Dalam Pengiriman" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DIBATALKAN", label: "Dibatalkan" },
];

export default function PengirimanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: pengiriman, isLoading, error } = usePengiriman(id);
  const updatePengiriman = useUpdatePengiriman();

  const handleBack = () => router.back();
  const [printing, setPrinting] = React.useState(false);
  const handleCetakInvoice = async () => {
    const penjualanId = p?.id;
    if (!penjualanId) return;
    setPrinting(true);
    try {
      const res = await penjualanService.getPenjualanById(penjualanId);
      const penjualan = res.data;
      if (!penjualan) return;
      const html = buildInvoicePenjualanA4Document({
        penjualan: penjualan as any,
        autoPrint: false,
      });
      openPrintPreviewDocument(html, { title: `Invoice ${penjualan.invoice}` });
    } finally {
      setPrinting(false);
    }
  };
  const handleStatusChange = (newStatus: string) => {
    updatePengiriman.mutate({ id, data: { status: newStatus } });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !pengiriman) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error?.message || "Gagal memuat data pengiriman"}
        </div>
        <Button onClick={handleBack} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  const p = pengiriman.penjualan;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="size-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detail Pengiriman</h1>
          <p className="text-sm text-muted-foreground">
            {p?.invoice ?? pengiriman.id}
          </p>
        </div>
        {p && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCetakInvoice}
            disabled={printing}
          >
            <Printer className="size-4 mr-2" />
            {printing ? "Memuat..." : "Cetak Invoice"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="size-5" />
              Data Pengiriman
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Status</p>
                <Select
                  value={pengiriman.status}
                  onValueChange={handleStatusChange}
                  disabled={updatePengiriman.isPending}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-muted-foreground">Invoice</p>
                <p className="font-medium">
                  {p ? (
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => router.push(`/penjualan/${p.id}`)}
                    >
                      {p.invoice}
                    </button>
                  ) : (
                    "-"
                  )}
                </p>
              </div>
              {pengiriman.nomorSuratJalan && (
                <div>
                  <p className="text-muted-foreground">No. Surat Jalan</p>
                  <p className="font-medium">{pengiriman.nomorSuratJalan}</p>
                </div>
              )}
              {pengiriman.jenisKendaraan && (
                <div>
                  <p className="text-muted-foreground">Jenis Kendaraan</p>
                  <p className="font-medium">{pengiriman.jenisKendaraan}</p>
                </div>
              )}
              {pengiriman.warnaKendaraan && (
                <div>
                  <p className="text-muted-foreground">Warna Kendaraan</p>
                  <p className="font-medium">{pengiriman.warnaKendaraan}</p>
                </div>
              )}
              {pengiriman.nomorKendaraan && (
                <div>
                  <p className="text-muted-foreground">Plat Nomor</p>
                  <p className="font-medium">{pengiriman.nomorKendaraan}</p>
                </div>
              )}
              {pengiriman.alamatKirim && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Alamat Kirim</p>
                  <p className="font-medium">{pengiriman.alamatKirim}</p>
                </div>
              )}
              {pengiriman.namaKurir && (
                <div>
                  <p className="text-muted-foreground">Kurir</p>
                  <p className="font-medium">{pengiriman.namaKurir}</p>
                </div>
              )}
              {pengiriman.nomorKurir && (
                <div>
                  <p className="text-muted-foreground">No. Kurir</p>
                  <p className="font-medium">{pengiriman.nomorKurir}</p>
                </div>
              )}
              {pengiriman.namaPenerima && (
                <div>
                  <p className="text-muted-foreground">Penerima</p>
                  <p className="font-medium">{pengiriman.namaPenerima}</p>
                </div>
              )}
              {pengiriman.nomorPenerima && (
                <div>
                  <p className="text-muted-foreground">No. Penerima</p>
                  <p className="font-medium">{pengiriman.nomorPenerima}</p>
                </div>
              )}
              {pengiriman.tanggalMulaiPengiriman && (
                <div>
                  <p className="text-muted-foreground">Tanggal Mulai Pengiriman</p>
                  <p className="font-medium">
                    {dayjs(pengiriman.tanggalMulaiPengiriman).format("DD MMM YYYY HH:mm")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Dibuat</p>
                <p className="font-medium">
                  {pengiriman.createdAt
                    ? dayjs(pengiriman.createdAt).format("DD MMM YYYY HH:mm")
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {p && (
          <Card>
            <CardHeader>
              <CardTitle>Penjualan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice</span>
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => router.push(`/penjualan/${p.id}`)}
                >
                  {p.invoice}
                </button>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pelanggan</span>
                <span>{p.pelanggan?.nama ?? "Walk-in"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">
                  {formatCurrency(Number(p.total))}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
