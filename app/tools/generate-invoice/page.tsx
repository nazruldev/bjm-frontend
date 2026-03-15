"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Package,
  Edit3,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useProduks } from "@/hooks/useProduks";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import dayjs from "@/lib/dayjs";

const PREFIX_MAP: Record<string, string> = {
  HUTANG: "HUT",
  PIUTANG: "PIU",
  PEMBAYARAN: "PBY",
  PEMBELIAN: "PMB",
  PENJUALAN: "PJL",
  PENGELUARAN: "PNG",
  MANUAL: "MNL",
};

function generateNoNota(prefix = "NOTA"): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}-${day}${month}${year}-${random}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function keteranganToHtml(keterangan: string): string {
  return escapeHtml(keterangan).replace(/\r?\n/g, "<br/>");
}

const NOTA_DEFAULT_PENGIRIM_KEY = "nota_default_pengirim";

interface NotaItem {
  id: string;
  nama: string;
  qty: number;
  satuan: string;
  harga: number;
  subtotal: number;
  fromProduk?: boolean;
}

const DEFAULT_PENGIRIM = {
  namaPt: "Alvian",
  alamat: "Jl. Brawijaya RT 004/RW 002,\nMongkonai Kota Kotamobagu Sulawesi Utara.",
  npwp: "16.804.501.1-824.000",
  namaPengirim: "Alvian",
};

const DEFAULT_KETERANGAN =
  "Mohon pembayaran di transfer ke Bank account kami:\n- Nama Bank : Mandiri\n- No. Rekening : 1500013431638\n- Nama Rekening : Alvian";

export default function GenerateInvoicePage() {
  const [namaPt, setNamaPt] = useState(DEFAULT_PENGIRIM.namaPt);
  const [alamat, setAlamat] = useState(DEFAULT_PENGIRIM.alamat);
  const [npwp, setNpwp] = useState(DEFAULT_PENGIRIM.npwp);
  const [tujuan, setTujuan] = useState("");
  const [noNota, setNoNota] = useState("");
  const [tanggal, setTanggal] = useState(dayjs().format("YYYY-MM-DD"));
  const [amountPaid, setAmountPaid] = useState("");
  const [namaPengirim, setNamaPengirim] = useState(DEFAULT_PENGIRIM.namaPengirim);
  const [keteranganTambahan, setKeteranganTambahan] = useState(DEFAULT_KETERANGAN);
  const [items, setItems] = useState<NotaItem[]>([]);

  // Tambah dari produk
  const [selectedProdukId, setSelectedProdukId] = useState("");
  const [qtyFromProduk, setQtyFromProduk] = useState("1");
  const [hargaFromProduk, setHargaFromProduk] = useState("");

  // Tambah manual
  const [manualNama, setManualNama] = useState("");
  const [manualQty, setManualQty] = useState("1");
  const [manualSatuan, setManualSatuan] = useState("kg");
  const [manualHarga, setManualHarga] = useState("");

  const { data: produkData } = useProduks({ limit: 500 });
  const produkList = produkData?.data ?? [];

  // Load default pengirim dari localStorage saat mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(NOTA_DEFAULT_PENGIRIM_KEY);
      if (saved) {
        const data = JSON.parse(saved) as {
          namaPt?: string;
          alamat?: string;
          npwp?: string;
          namaPengirim?: string;
        };
        if (data.namaPt) setNamaPt(data.namaPt);
        if (data.alamat) setAlamat(data.alamat);
        if (data.npwp) setNpwp(data.npwp);
        if (data.namaPengirim) setNamaPengirim(data.namaPengirim);
      }
    } catch {
      // ignore
    }
  }, []);

  const simpanDefaultPengirim = () => {
    try {
      const data = {
        namaPt,
        alamat,
        npwp,
        namaPengirim,
      };
      localStorage.setItem(NOTA_DEFAULT_PENGIRIM_KEY, JSON.stringify(data));
      toast.success("Default pengirim disimpan. Akan dipakai saat buka halaman ini lagi.");
    } catch {
      toast.error("Gagal menyimpan default pengirim");
    }
  };

  const subtotalNota = useMemo(
    () => items.reduce((sum, i) => sum + i.subtotal, 0),
    [items]
  );
  const totalNota = subtotalNota; // bisa ditambah tax nanti
  const amountPaidNum = useMemo(
    () => parseFloat(amountPaid.replace(/\D/g, "")) || 0,
    [amountPaid]
  );
  const balanceDue = Math.max(0, totalNota - amountPaidNum);

  const handleGenerateNoNota = () => {
    setNoNota(generateNoNota("NOTA"));
  };

  const handleReset = () => {
    setNamaPt(DEFAULT_PENGIRIM.namaPt);
    setAlamat(DEFAULT_PENGIRIM.alamat);
    setNpwp(DEFAULT_PENGIRIM.npwp);
    setNamaPengirim(DEFAULT_PENGIRIM.namaPengirim);
    setTujuan("");
    setNoNota("");
    setTanggal(dayjs().format("YYYY-MM-DD"));
    setAmountPaid("");
    setKeteranganTambahan(DEFAULT_KETERANGAN);
    setItems([]);
    setSelectedProdukId("");
    setQtyFromProduk("1");
    setHargaFromProduk("");
    setManualNama("");
    setManualQty("1");
    setManualSatuan("kg");
    setManualHarga("");
    toast.success("Form direset ke nilai awal.");
  };

  const addFromProduk = () => {
    const produk = produkList.find((p) => p.id === selectedProdukId);
    if (!produk) {
      toast.error("Pilih produk dulu");
      return;
    }
    const qty = parseFloat(qtyFromProduk) || 1;
    const harga = parseFloat(hargaFromProduk.replace(/\D/g, "")) || Number(produk.harga_jual) || 0;
    const subtotal = qty * harga;
    setItems((prev) => [
      ...prev,
      {
        id: `p-${produk.id}-${Date.now()}`,
        nama: produk.nama_produk,
        qty,
        satuan: produk.satuan,
        harga,
        subtotal,
        fromProduk: true,
      },
    ]);
    setSelectedProdukId("");
    setQtyFromProduk("1");
    setHargaFromProduk("");
    toast.success("Produk ditambah");
  };

  const addManual = () => {
    const nama = manualNama.trim();
    if (!nama) {
      toast.error("Nama barang wajib diisi");
      return;
    }
    const qty = parseFloat(manualQty) || 1;
    const harga = parseFloat(manualHarga.replace(/\D/g, "")) || 0;
    const subtotal = qty * harga;
    setItems((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        nama,
        qty,
        satuan: manualSatuan.trim() || "pcs",
        harga,
        subtotal,
      },
    ]);
    setManualNama("");
    setManualQty("1");
    setManualSatuan("kg");
    setManualHarga("");
    toast.success("Barang manual ditambah");
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handlePrint = () => {
    if (items.length === 0) {
      toast.error("Tambahkan minimal 1 barang");
      return;
    }
    const rows = items
      .map(
        (i) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111">${i.nama}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#374151">${i.qty} ${i.satuan}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#374151">${formatCurrency(i.harga)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#111">${formatCurrency(i.subtotal)}</td>
          </tr>`
      )
      .join("");
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nota ${noNota || "Nota"}</title>
  <style>
    body { font-family: system-ui, sans-serif; font-size: 14px; color: #111; padding: 32px; max-width: 700px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
    .header-left { }
    .header-right { text-align: right; }
    .invoice-title { font-size: 24px; font-weight: bold; }
    /* Judul cetak: Nota */
    .bill-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #374151; color: white; }
    th { padding: 12px; text-align: left; font-weight: 600; }
    th:last-child, td:last-child { text-align: right; }
    th:nth-child(2), th:nth-child(3) { text-align: right; }
    .summary { margin-top: 24px; text-align: right; width: 220px; margin-left: auto; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .summary-total { border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px; font-weight: bold; }
    .footer { margin-top: 48px; }
    .hormat { margin-top: 32px; font-weight: 600; }
    .nama-pengirim { margin-top: 60px; font-weight: 600; }
    .keterangan { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #374151; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${namaPt ? `<p style="font-weight:bold;font-size:18px;margin:0">${namaPt}</p>` : ""}
      ${alamat ? `<p style="margin:4px 0 0 0;color:#4b5563;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:break-word;max-width:100%">${escapeHtml(alamat).replace(/\r?\n/g, "<br/>")}</p>` : ""}
      ${npwp ? `<p style="margin:2px 0 0 0;color:#4b5563">NPWP: ${escapeHtml(npwp)}</p>` : ""}
    </div>
    <div class="header-right">
      <p class="invoice-title" style="margin:0">NOTA</p>
      ${noNota ? `<p style="margin:4px 0 0 0;font-family:monospace">#${noNota.replace(/^#/, "")}</p>` : ""}
      <p style="margin:4px 0 0 0;color:#4b5563">Tanggal: ${dayjs(tanggal).format("D MMM YYYY")}</p>
    </div>
  </div>
  <div class="bill-row">
    <div>
      <p style="font-size:11px;font-weight:600;color:#6b7280;margin:0;text-transform:uppercase">Kepada:</p>
      ${tujuan ? `<p style="margin:4px 0 0 0;font-weight:500;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:break-word;max-width:100%">${escapeHtml(tujuan).replace(/\r?\n/g, "<br/>")}</p>` : ""}
    </div>
    <div style="text-align:right">
      <p style="font-size:11px;font-weight:600;color:#6b7280;margin:0;text-transform:uppercase">Sisa Bayar:</p>
      <p style="margin:4px 0 0 0;font-size:18px;font-weight:bold">Rp ${formatCurrency(balanceDue)}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Barang</th>
        <th>Jumlah</th>
        <th>Harga Satuan</th>
        <th>Jumlah (Rp)</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">
    <div class="summary-row"><span style="color:#4b5563">Subtotal:</span><span>Rp ${formatCurrency(subtotalNota)}</span></div>
    <div class="summary-row"><span style="color:#4b5563">Pajak (0%):</span><span>Rp 0</span></div>
    <div class="summary-row summary-total"><span style="font-weight:bold">Total:</span><span style="font-weight:bold">Rp ${formatCurrency(totalNota)}</span></div>
    ${amountPaidNum > 0 ? `<div class="summary-row"><span style="color:#4b5563">Dibayar:</span><span>Rp ${formatCurrency(amountPaidNum)}</span></div>` : ""}
  </div>
  <div class="footer">
    <p class="hormat">Hormat kami,</p>
    ${namaPengirim ? `<p class="nama-pengirim">${namaPengirim}</p>` : "<p class=\"nama-pengirim\">&nbsp;</p>"}
    ${keteranganTambahan ? `<div class="keterangan"><strong>Keterangan tambahan:</strong><br/>${keteranganToHtml(keteranganTambahan)}</div>` : ""}
  </div>
</body>
</html>`;
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Izinkan pop-up untuk cetak");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  return (
    <div className="space-y-6 p-6 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileText className="size-6" />
            Buat Nota / Faktur
          </h1>
          <p className="text-muted-foreground mt-1">
            Alat mandiri untuk membuat nota/faktur. Isi PT, alamat, tujuan, dan barang (dari produk atau tulis manual). Tidak tersimpan ke database.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleReset} className="shrink-0">
          <RotateCcw className="size-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        {/* Form */}
        <div className="space-y-6 ">
          <Card>
            <CardHeader>
              <CardTitle>Pengirim & Penerima</CardTitle>
              <CardDescription>Data pengirim (kiri) dan penerima (kanan).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Pengirim */}
                <div className="space-y-3 rounded-lg border p-4">
                  <p className="text-sm font-semibold text-muted-foreground">Pengirim</p>
                  <div className="space-y-2">
                    <Label className="text-xs">Nama PT / Perusahaan</Label>
                    <Input
                      placeholder="PT / Nama"
                      value={namaPt}
                      onChange={(e) => setNamaPt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Alamat</Label>
                    <Textarea
                      placeholder="Alamat pengirim"
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">NPWP</Label>
                    <Input
                      placeholder="00.000.000.0-000.000"
                      value={npwp}
                      onChange={(e) => setNpwp(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Nama Pengirim (Hormat kami)</Label>
                    <Input
                      placeholder="Nama penandatangan"
                      value={namaPengirim}
                      onChange={(e) => setNamaPengirim(e.target.value)}
                    />
                  </div>
                </div>
                {/* Penerima */}
                <div className="space-y-3 rounded-lg border p-4">
                  <p className="text-sm font-semibold text-muted-foreground">Penerima</p>
                  <div className="space-y-2">
                    <Label className="text-xs">Tujuan / Alamat Tujuan</Label>
                    <Textarea
                      placeholder="Kepada Yth. Nama / Perusahaan, Alamat..."
                      value={tujuan}
                      onChange={(e) => setTujuan(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
              {/* Baris umum: No. Nota, Tanggal, Jumlah Dibayar, Keterangan */}
              <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-xs">No. Nota</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Kosongkan atau buat"
                      value={noNota}
                      onChange={(e) => setNoNota(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={handleGenerateNoNota}>
                      Buat
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tanggal</Label>
                  <Input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Jumlah Dibayar (Opsional)</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={formatCurrency(amountPaid || "")}
                      onChange={(e) => setAmountPaid(parseCurrency(e.target.value))}
                      placeholder="0"
                      autoComplete="off"
                      className="pl-10"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                      Rp
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Keterangan Tambahan</Label>
                <Textarea
                  placeholder="Catatan, rekening transfer, dll. (bisa beberapa baris)"
                  value={keteranganTambahan}
                  onChange={(e) => setKeteranganTambahan(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center gap-2 border-t pt-4">
                <Button type="button" variant="outline" size="sm" onClick={simpanDefaultPengirim}>
                  Simpan sebagai default pengirim
                </Button>
                <span className="text-xs text-muted-foreground">
                  Simpan Nama PT, Alamat, NPWP, Nama Pengirim untuk dipakai lagi.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Barang</CardTitle>
              <CardDescription>Tambah dari produk (kiri) atau tulis manual (kanan).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Dari Produk */}
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Package className="size-4" />
                    Dari Produk
                  </p>
                  <div className="space-y-2">
                    <Label className="text-xs">Produk</Label>
                    <Select
                      value={selectedProdukId}
                      onValueChange={(v) => {
                        setSelectedProdukId(v);
                        const p = produkList.find((x) => x.id === v);
                        if (p?.harga_jual != null) setHargaFromProduk(String(p.harga_jual));
                        else setHargaFromProduk("");
                      }}
                    >
                      <SelectTrigger  className="w-full">
                        <SelectValue placeholder="Pilih produk" />
                      </SelectTrigger>
                      <SelectContent>
                        {produkList.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nama_produk} ({p.satuan})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={qtyFromProduk}
                        onChange={(e) => setQtyFromProduk(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Harga</Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={formatCurrency(hargaFromProduk || "")}
                          onChange={(e) => setHargaFromProduk(parseCurrency(e.target.value))}
                          placeholder="0"
                          autoComplete="off"
                          className="pl-10"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                          Rp
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button type="button" size="sm" className="w-full" onClick={addFromProduk}>
                    <Plus className="size-4 mr-1" />
                    Tambah
                  </Button>
                </div>

                {/* Tulis Manual */}
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Edit3 className="size-4" />
                    Tulis Manual
                  </p>
                  <div className="space-y-2">
                    <Label className="text-xs">Nama Barang</Label>
                    <Input
                      placeholder="Nama barang"
                      value={manualNama}
                      onChange={(e) => setManualNama(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="0.01"
                        value={manualQty}
                        onChange={(e) => setManualQty(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Satuan</Label>
                      <Input
                        placeholder="kg"
                        value={manualSatuan}
                        onChange={(e) => setManualSatuan(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Harga</Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={formatCurrency(manualHarga || "")}
                          onChange={(e) => setManualHarga(parseCurrency(e.target.value))}
                          placeholder="0"
                          autoComplete="off"
                          className="pl-10"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                          Rp
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="w-full" onClick={addManual}>
                    <Plus className="size-4 mr-1" />
                    Tambah Manual
                  </Button>
                </div>
              </div>

              {/* Daftar item */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <Label>Daftar Barang ({items.length})</Label>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2">Nama</th>
                          <th className="text-right p-2">Qty</th>
                          <th className="text-right p-2">Harga</th>
                          <th className="text-right p-2">Subtotal</th>
                          <th className="w-8 p-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((i) => (
                          <tr key={i.id} className="border-b last:border-0">
                            <td className="p-2">{i.nama}</td>
                            <td className="text-right p-2">{i.qty} {i.satuan}</td>
                            <td className="text-right p-2">{formatCurrency(i.harga)}</td>
                            <td className="text-right p-2 font-medium">{formatCurrency(i.subtotal)}</td>
                            <td className="p-2 w-10">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => removeItem(i.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-right font-semibold">Total: {formatCurrency(totalNota)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Nota */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview Nota</CardTitle>
              <CardDescription>Tampilan untuk dicetak. Gunakan tombol Cetak Nota.</CardDescription>
              <Button className="mt-2 no-print" onClick={handlePrint} disabled={items.length === 0}>
                <Printer className="size-4 mr-2" />
                Cetak Nota
              </Button>
            </CardHeader>
            <CardContent>
              <div
                id="nota-print"
                className="print-area bg-white text-black p-8 rounded-lg border max-w-2xl mx-auto shadow-sm"
              >
                {/* Header: kiri = pengirim, kanan = NOTA + no + tanggal */}
                <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
                  <div>
                    {namaPt && <p className="font-bold text-xl text-gray-900">{namaPt}</p>}
                    {alamat && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap wrap-break-word max-w-full">{alamat}</p>}
                    {npwp && <p className="text-sm text-gray-600">NPWP: {npwp}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">NOTA</p>
                    {noNota && (
                      <p className="text-sm font-mono mt-1 text-gray-700">#{noNota.replace(/^#/, "")}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Tanggal: {dayjs(tanggal).format("D MMM YYYY")}
                    </p>
                  </div>
                </div>

                {/* Kepada (kiri) & Sisa Bayar (kanan) */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kepada:</p>
                    {tujuan && <p className="text-sm font-medium text-gray-900 mt-1 whitespace-pre-wrap wrap-break-word max-w-full">{tujuan}</p>}
                  </div>
                  {items.length > 0 && (
                    <div className="text-right">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sisa Bayar:</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                        Rp {formatCurrency(balanceDue)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tabel: Barang, Jumlah, Harga Satuan, Jumlah (Rp) */}
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-700 text-white">
                      <th className="text-left py-3 px-3 font-semibold">Barang</th>
                      <th className="text-right py-3 px-3 font-semibold">Jumlah</th>
                      <th className="text-right py-3 px-3 font-semibold">Harga Satuan</th>
                      <th className="text-right py-3 px-3 font-semibold">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          Belum ada barang. Tambah dari produk atau tulis manual.
                        </td>
                      </tr>
                    ) : (
                      items.map((i) => (
                        <tr key={i.id} className="border-b border-gray-200">
                          <td className="py-3 px-3 text-gray-900">{i.nama}</td>
                          <td className="text-right py-3 px-3 text-gray-700">
                            {i.qty} {i.satuan}
                          </td>
                          <td className="text-right py-3 px-3 text-gray-700">
                            {formatCurrency(i.harga)}
                          </td>
                          <td className="text-right py-3 px-3 font-medium text-gray-900">
                            {formatCurrency(i.subtotal)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Ringkasan: Subtotal, Pajak (0%), Total, Dibayar */}
                {items.length > 0 && (
                  <div className="mt-8 flex justify-end">
                    <div className="w-56 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">Rp {formatCurrency(subtotalNota)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pajak (0%):</span>
                        <span className="font-medium">Rp 0</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="font-bold text-gray-900">Rp {formatCurrency(totalNota)}</span>
                      </div>
                      {amountPaidNum > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dibayar:</span>
                          <span className="font-medium">Rp {formatCurrency(amountPaidNum)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hormat kami, nama pengirim, keterangan tambahan */}
                <div className="mt-12 pt-4">
                  <p className="font-semibold text-gray-900">Hormat kami,</p>
                  <p className="mt-16 font-semibold text-gray-900">{namaPengirim || "—"}</p>
                  {keteranganTambahan.trim() && (
                    <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600 max-w-full overflow-hidden">
                      <p className="font-medium text-gray-900">Keterangan tambahan:</p>
                      <p className="mt-1 whitespace-pre-wrap wrap-break-word">{keteranganTambahan}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; }
              .no-print { display: none !important; }
            }
          `,
        }}
      />
    </div>
  );
}
