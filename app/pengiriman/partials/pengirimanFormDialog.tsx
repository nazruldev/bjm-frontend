"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePengiriman } from "@/hooks/usePengiriman";
import type { CreatePengirimanDto } from "@/services/pengirimanService";
import type { Penjualan } from "@/services/penjualanService";

const WARNA_KENDARAAN_OPTIONS = [
  "Hitam",
  "Putih",
  "Silver",
  "Abu-abu",
  "Merah",
  "Biru",
  "Hijau",
  "Kuning",
  "Cokelat",
  "Oranye",
  "Emas",
  "Navy",
  "Maroon",
  "Krem",
  "Ungu",
  "Pink",
  "Bronze",
  "Abu-abu gelap",
  "Putih gading",
  "Lainnya",
] as const;

const JENIS_KENDARAAN_OPTIONS = [
  "Motor",
  "Mobil",
  "Pick Up",
  "Minibus",
  "Truk Kecil",
  "Truk",
  "Fuso",
  "Tronton",
  "Lainnya",
] as const;

interface PengirimanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  penjualanOptions: Penjualan[];
  /** Pre-select penjualan (e.g. from penjualan list "Tambah Pengiriman") */
  initialPenjualanId?: string | null;
  onSuccess?: () => void;
}

export function PengirimanFormDialog({
  open,
  onOpenChange,
  penjualanOptions,
  initialPenjualanId,
  onSuccess,
}: PengirimanFormDialogProps) {
  const [penjualanId, setPenjualanId] = React.useState("");
  const [status, setStatus] = React.useState<string>("MENUNGGU");
  const [alamatKirim, setAlamatKirim] = React.useState("");
  const [namaKurir, setNamaKurir] = React.useState("");
  const [nomorKurir, setNomorKurir] = React.useState("");
  const [namaPenerima, setNamaPenerima] = React.useState("");
  const [nomorPenerima, setNomorPenerima] = React.useState("");
  const [jenisKendaraan, setJenisKendaraan] = React.useState("");
  const [warnaKendaraan, setWarnaKendaraan] = React.useState("");
  const [nomorKendaraan, setNomorKendaraan] = React.useState("");
  const [nomorSuratJalan, setNomorSuratJalan] = React.useState("");
  const [tanggalMulaiPengiriman, setTanggalMulaiPengiriman] = React.useState("");

  const createPengiriman = useCreatePengiriman();

  React.useEffect(() => {
    if (initialPenjualanId && penjualanOptions.some((p) => p.id === initialPenjualanId)) {
      setPenjualanId(initialPenjualanId);
    }
  }, [initialPenjualanId, penjualanOptions]);

  React.useEffect(() => {
    if (!open) {
      setPenjualanId(initialPenjualanId || "");
      setStatus("MENUNGGU");
      setAlamatKirim("");
      setNamaKurir("");
      setNomorKurir("");
      setNamaPenerima("");
      setNomorPenerima("");
      setJenisKendaraan("");
      setWarnaKendaraan("");
      setNomorKendaraan("");
      setNomorSuratJalan("");
      setTanggalMulaiPengiriman("");
    }
  }, [open, initialPenjualanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!penjualanId.trim()) return;
    const payload: CreatePengirimanDto = {
      penjualanId: penjualanId.trim(),
      status,
      alamatKirim: alamatKirim.trim() || null,
      namaKurir: namaKurir.trim() || null,
      nomorKurir: nomorKurir.trim() || null,
      namaPenerima: namaPenerima.trim() || null,
      nomorPenerima: nomorPenerima.trim() || null,
      jenisKendaraan: jenisKendaraan && jenisKendaraan.trim() ? jenisKendaraan.trim() : null,
      warnaKendaraan: warnaKendaraan && warnaKendaraan.trim() ? warnaKendaraan.trim() : null,
      nomorKendaraan: nomorKendaraan.trim() || null,
      nomorSuratJalan: nomorSuratJalan.trim() || null,
      tanggalMulaiPengiriman: tanggalMulaiPengiriman
        ? (tanggalMulaiPengiriman.length === 10
            ? `${tanggalMulaiPengiriman}T12:00:00`
            : String(tanggalMulaiPengiriman))
        : null,
    };
    try {
      await createPengiriman.mutateAsync(payload);
      onSuccess?.();
      onOpenChange(false);
    } catch {
      // Error di-handle di hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Pengiriman</DialogTitle>
          <DialogDescription>
            Pilih penjualan yang akan dikirim dan isi data pengiriman.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
         <div className="grid grid-cols-2 gap-4">

         <div className="space-y-2">
            <Label>Penjualan (Invoice) *</Label>
            <Select
              value={penjualanId}
              onValueChange={setPenjualanId}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue  placeholder="Pilih penjualan" />
              </SelectTrigger>
              <SelectContent>
                {penjualanOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.invoice}
                    {p.pelanggan ? ` - ${p.pelanggan.nama}` : " - Walk-in"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {penjualanOptions.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Semua penjualan sudah memiliki data pengiriman.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MENUNGGU">Menunggu</SelectItem>
                <SelectItem value="DALAM_PENGIRIMAN">Dalam Pengiriman</SelectItem>
                <SelectItem value="SELESAI">Selesai</SelectItem>
                <SelectItem value="DIBATALKAN">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
          <div className="space-y-2">
            <div className="space-y-2">
              <Label>Jenis Kendaraan</Label>
              <Select value={jenisKendaraan} onValueChange={setJenisKendaraan}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jenis kendaraan" />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_KENDARAAN_OPTIONS.map((j) => (
                    <SelectItem key={j} value={j}>
                      {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Warna Kendaraan</Label>
              <Select value={warnaKendaraan} onValueChange={setWarnaKendaraan}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih warna" />
                </SelectTrigger>
                <SelectContent>
                  {WARNA_KENDARAAN_OPTIONS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Plat Nomor</Label>
            <Input
              value={nomorKendaraan}
              onChange={(e) => setNomorKendaraan(e.target.value)}
              placeholder="Nomor polisi"
            />
          </div>
          <div className="space-y-2">
            <Label>No. Surat Jalan</Label>
            <Input
              value={nomorSuratJalan}
              onChange={(e) => setNomorSuratJalan(e.target.value)}
              placeholder="Nomor surat jalan"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
              <Label>Nama Kurir</Label>
              <Input
                value={namaKurir}
                onChange={(e) => setNamaKurir(e.target.value)}
                placeholder="Nama kurir"
              />
            </div>
            <div className="space-y-2">
              <Label>No. Telepon Kurir</Label>
              <Input
                value={nomorKurir}
                onChange={(e) => setNomorKurir(e.target.value)}
                placeholder="Telepon kurir"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
              <Label>Nama Penerima</Label>
              <Input
                value={namaPenerima}
                onChange={(e) => setNamaPenerima(e.target.value)}
                placeholder="Nama penerima"
              />
            </div>
            <div className="space-y-2">
              <Label>No. Telepon Penerima</Label>
              <Input
                value={nomorPenerima}
                onChange={(e) => setNomorPenerima(e.target.value)}
                placeholder="Telepon penerima"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tanggal Mulai Pengiriman</Label>
            <Input
              type="datetime-local"
              value={tanggalMulaiPengiriman}
              onChange={(e) => setTanggalMulaiPengiriman(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!penjualanId || createPengiriman.isPending}>
              {createPengiriman.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
