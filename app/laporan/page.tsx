"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, Printer } from "lucide-react";
import {
  useLaporanMutasiStok,
  useLaporanPenjemuran,
  useLaporanPengupasan,
  useLaporanPensortiran,
  useLaporanPiutang,
  useLaporanHutang,
  useLaporanAbsensi,
  useLaporanPenggajian,
  useLaporanPembelian,
  useLaporanPenjualan,
  useLaporanPembayaran,
  useLaporanRingkasan,
  useLaporanKeuangan,
  useLaporanPendingApproval,
} from "@/hooks/useLaporan";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import dayjs from "@/lib/dayjs";
import { formatCurrency, formatDecimal } from "@/lib/utils";
import { useOutlets } from "@/hooks/useOutlets";
import { useAuth } from "@/hooks/useAuth";
import { usePekerjas } from "@/hooks/usePekerjas";
import { usePemasoks } from "@/hooks/usePemasoks";
import { useKaryawans } from "@/hooks/useKaryawans";

/** Label Indonesia untuk key ringkasan (camelCase → tampilan) */
const SUMMARY_LABELS: Record<string, string> = {
  total: "Total Data",
  totalMasuk: "Total Masuk",
  totalKeluar: "Total Keluar",
  totalCash: "Total Cash",
  totalCashless: "Total Cashless",
  count: "Jumlah",
  totalPembelian: "Total Pembelian",
  totalPenjualan: "Total Penjualan",
  pending: "Menunggu",
  approved: "Disetujui",
  dibatalkan: "Dibatalkan",
};
/** Deteksi dari nama key: nilainya uang (semua laporan) → Rp di depan. Key persis "total" = jumlah data, bukan Rp. */
function isSummaryCurrencyKey(key: string): boolean {
  const k = key.toLowerCase();
  if (k === "total") return false; // "total" = total data (count), bukan total rupiah
  return (
    /total|masuk|keluar|cash|rupiah|saldo|bayar|hutang|piutang|pembelian|penjualan|pembayaran|nominal|value/.test(k)
  );
}
/** Deteksi dari nama key: nilainya jumlah/kuantitas → kg di belakang */
function isSummaryJumlahKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    /jumlah|kg|quantity|berat|weight/.test(k) ||
    /menir|abu|keping|bulat|busuk|sortir|produk/.test(k)
  );
}
/** Deteksi dari nama key: nilainya jam → " jam" di belakang */
function isSummaryJamKey(key: string): boolean {
  const k = key.toLowerCase();
  return /jam|hour|durasi/.test(k);
}
function formatSummaryLabel(key: string): string {
  return (
    SUMMARY_LABELS[key] ??
    key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim()
  );
}
function formatSummaryValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") {
    if (isSummaryJamKey(key)) return value.toLocaleString("id-ID") + " jam";
    if (isSummaryJumlahKey(key)) return value.toLocaleString("id-ID") + " kg";
    if (isSummaryCurrencyKey(key)) return "Rp " + formatCurrency(value);
    return value.toLocaleString("id-ID");
  }
  return String(value);
}

/** Format jam untuk tampilan: terima string "HH:mm" / "HH:mm:ss" atau datetime, hindari Invalid Date */
function safeTime(t: string | Date | null | undefined): string {
  if (t == null || t === "") return "-";
  const s = String(t).trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return s.length > 5 ? s.substring(0, 5) : s;
  try {
    const parsed = dayjs(t);
    return parsed.isValid() ? parsed.format("HH:mm") : "-";
  } catch {
    return "-";
  }
}

type LaporanType =
  | "mutasi-stok"
  | "penjemuran"
  | "pengupasan"
  | "pensortiran"
  | "piutang"
  | "hutang"
  | "absensi"
  | "penggajian"
  | "pembelian"
  | "penjualan"
  | "pembayaran"
  | "keuangan"
  | "pending-approval"
  | "ringkasan";

const laporanTypes: { value: LaporanType; label: string; category: string }[] = [
  { value: "mutasi-stok", label: "Laporan Mutasi Stok", category: "Data Produk" },
  { value: "penjemuran", label: "Laporan Penjemuran", category: "Produksi" },
  { value: "pengupasan", label: "Laporan Pengupasan", category: "Produksi" },
  { value: "pensortiran", label: "Laporan Pensortiran", category: "Produksi" },
  { value: "piutang", label: "Laporan Piutang", category: "Hutang Piutang" },
  { value: "hutang", label: "Laporan Hutang", category: "Hutang Piutang" },
  { value: "absensi", label: "Laporan Absensi", category: "Penggajian" },
  { value: "penggajian", label: "Laporan Penggajian", category: "Penggajian" },
  { value: "pembelian", label: "Laporan Pembelian", category: "Jual Beli" },
  { value: "penjualan", label: "Laporan Penjualan", category: "Jual Beli" },
  { value: "pembayaran", label: "Laporan Pembayaran", category: "Pembayaran" },
  { value: "keuangan", label: "Laporan Keuangan", category: "Pembayaran" },
  { value: "pending-approval", label: "Laporan Menunggu Approval", category: "Pembayaran" },
  { value: "ringkasan", label: "Laporan Ringkasan", category: "Ringkasan" },
];

/** Admin hanya boleh akses laporan ini; Owner bisa akses semua */
const ADMIN_LAPORAN_VALUES: LaporanType[] = [
  "absensi",
  "penggajian",
  "pembelian",
  "pengupasan",
  "penjemuran",
  "piutang",
  "hutang"
];

export default function LaporanPage() {
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanType>("ringkasan");
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";
  const isAdmin = user?.role === "ADMIN";

  const visibleLaporanTypes = React.useMemo(() => {
    if (isOwner) return laporanTypes;
    if (isAdmin)
      return laporanTypes.filter((t) => ADMIN_LAPORAN_VALUES.includes(t.value));
    return laporanTypes;
  }, [isOwner, isAdmin]);

  React.useEffect(() => {
    if (isAdmin && selectedLaporan && !ADMIN_LAPORAN_VALUES.includes(selectedLaporan)) {
      setSelectedLaporan("absensi");
    }
  }, [isAdmin, selectedLaporan]);
  
  // Fetch outlets hanya jika user adalah OWNER
  const { data: outletsData } = useOutlets(
    { limit: 1000 },
    { enabled: isOwner && !!user }
  );

  // Local filter state (not applied yet)
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOutletId, setFilterOutletId] = useState<string>("");
  const [filterPekerjaId, setFilterPekerjaId] = useState<string>("");
  const [filterPemasokId, setFilterPemasokId] = useState<string>("");
  const [filterSubjekType, setFilterSubjekType] = useState<string>(""); // PEMASOK | KARYAWAN | PEKERJA
  const [filterSubjekId, setFilterSubjekId] = useState<string>("");
  const [filterKaryawanId, setFilterKaryawanId] = useState<string>("");

  // Applied filter state (used for query)
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [status, setStatus] = useState("");
  const [outletId, setOutletId] = useState<string>("");
  const [pekerjaId, setPekerjaId] = useState<string>("");
  const [pemasokId, setPemasokId] = useState<string>("");
  const [subjekType, setSubjekType] = useState<string>("");
  const [subjekId, setSubjekId] = useState<string>("");
  const [karyawanId, setKaryawanId] = useState<string>("");

  // Fetch pekerja & pemasok untuk filter Laporan Penjemuran / Pengupasan / Pembelian
  const { data: pekerjasData } = usePekerjas({
    limit: 1000,
    ...(isOwner && filterOutletId ? { outletId: filterOutletId } : {}),
  });
  const { data: pemasoksData } = usePemasoks({ limit: 1000 });
  const { data: karyawansData } = useKaryawans({
    limit: 1000,
    ...(isOwner && filterOutletId ? { outletId: filterOutletId } : {}),
  });

  const params = React.useMemo(() => {
    const p: any = {};
    if (dateFrom) {
      p.dateFrom = dayjs(dateFrom).format("YYYY-MM-DD");
    }
    if (dateTo) {
      p.dateTo = dayjs(dateTo).format("YYYY-MM-DD");
    }
    if (status) {
      p.status = status;
    }
    if (outletId) {
      p.outletId = outletId;
    }
    if (pekerjaId) {
      p.pekerjaId = pekerjaId;
    }
    if (pemasokId) {
      p.pemasokId = pemasokId;
    }
    if (subjekType) {
      p.subjekType = subjekType;
    }
    if (subjekId) {
      p.subjekId = subjekId;
    }
    if (karyawanId) {
      p.karyawanId = karyawanId;
    }
    return p;
  }, [dateFrom, dateTo, status, outletId, pekerjaId, pemasokId, subjekType, subjekId, karyawanId]);

  const handleApplyFilter = () => {
    setDateFrom(filterDateFrom);
    setDateTo(filterDateTo);
    setStatus(filterStatus);
    setOutletId(filterOutletId);
    setPekerjaId(filterPekerjaId);
    setPemasokId(filterPemasokId);
    setSubjekType(filterSubjekType);
    setSubjekId(filterSubjekId);
    setKaryawanId(filterKaryawanId);
  };

  const handleResetFilter = () => {
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
    setFilterStatus("");
    setFilterOutletId("");
    setFilterPekerjaId("");
    setFilterPemasokId("");
    setFilterSubjekType("");
    setFilterSubjekId("");
    setFilterKaryawanId("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setStatus("");
    setOutletId("");
    setPekerjaId("");
    setPemasokId("");
    setSubjekType("");
    setSubjekId("");
    setKaryawanId("");
  };

  // Hooks untuk semua laporan
  const laporanMutasiStok = useLaporanMutasiStok(params);
  const laporanPenjemuran = useLaporanPenjemuran(params);
  const laporanPengupasan = useLaporanPengupasan(params);
  const laporanPensortiran = useLaporanPensortiran(params);
  const laporanPiutang = useLaporanPiutang(params);
  const laporanHutang = useLaporanHutang(params);
  const laporanAbsensi = useLaporanAbsensi(params);
  const laporanPenggajian = useLaporanPenggajian(params);
  const laporanPembelian = useLaporanPembelian(params);
  const laporanPenjualan = useLaporanPenjualan(params);
  const laporanPembayaran = useLaporanPembayaran(params);
  const laporanKeuangan = useLaporanKeuangan(params);
  const laporanPendingApproval = useLaporanPendingApproval(params);
  const laporanRingkasan = useLaporanRingkasan(params);

  const getCurrentLaporan = () => {
    switch (selectedLaporan) {
      case "mutasi-stok":
        return laporanMutasiStok;
      case "penjemuran":
        return laporanPenjemuran;
      case "pengupasan":
        return laporanPengupasan;
      case "pensortiran":
        return laporanPensortiran;
      case "piutang":
        return laporanPiutang;
      case "hutang":
        return laporanHutang;
      case "absensi":
        return laporanAbsensi;
      case "penggajian":
        return laporanPenggajian;
      case "pembelian":
        return laporanPembelian;
      case "penjualan":
        return laporanPenjualan;
      case "pembayaran":
        return laporanPembayaran;
      case "keuangan":
        return laporanKeuangan;
      case "pending-approval":
        return laporanPendingApproval;
      case "ringkasan":
        return laporanRingkasan;
      default:
        return laporanRingkasan;
    }
  };

  const currentLaporan = getCurrentLaporan();
  const laporanData = currentLaporan.data?.data || [];
  // Summary hanya ada di LaporanResponse, bukan ApiResponse
  // Type guard untuk memeriksa apakah data memiliki property summary
  const summary = currentLaporan.data && 'summary' in currentLaporan.data
    ? (currentLaporan.data as any).summary 
    : undefined;
  
  // Helper untuk mendapatkan total dengan type guard
  const getTotal = () => {
    if (!currentLaporan.data) return 0;
    if ('total' in currentLaporan.data) {
      return (currentLaporan.data as any).total || 0;
    }
    // Jika ApiResponse, hitung dari array data
    if (Array.isArray(currentLaporan.data.data)) {
      return currentLaporan.data.data.length;
    }
    return 0;
  };
  
  const total = getTotal();

  const handleExport = () => {
    // TODO: Implement export to Excel/PDF
    alert("Fitur export akan segera tersedia");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const laporanTitle = laporanTypes.find((t) => t.value === selectedLaporan)?.label || "Laporan";
    const currentDate = dayjs().format("DD MMMM YYYY HH:mm");
    const selectedOutletName = outletId && outletsData?.data 
      ? outletsData.data.find((o: any) => o.id === outletId)?.nama 
      : isOwner ? "Semua Outlet" : null;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${laporanTitle}</title>
          <style>
            @media print {
              @page {
                margin: 1cm;
                size: A4 landscape;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 10pt;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              font-size: 12pt;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 18pt;
            }
            .header p {
              margin: 5px 0;
              font-size: 10pt;
            }
            .info {
              margin-bottom: 20px;
              font-size: 10pt;
            }
            .info-row {
              display: flex;
              margin-bottom: 5px;
            }
            .info-label {
              font-weight: bold;
              width: 150px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 9pt;
            }
            th, td {
              border: 1px solid #000;
              padding: 6px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .summary {
              margin-top: 20px;
              padding: 10px;
              background-color: #f9f9f9;
              border: 1px solid #000;
            }
            .summary h3 {
              margin-top: 0;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-value {
              font-size: 14pt;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 9pt;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${laporanTitle}</h1>
            <p>BJM - Kotamobagu</p>
            <p>Dicetak pada: ${currentDate}</p>
          </div>
          
          <div class="info">
            <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px; background-color: #f9f9f9;">
              <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 12pt; font-weight: bold;">Filter yang Digunakan:</h3>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                <div class="info-row"><span class="info-label">Jenis Laporan:</span> ${laporanTitle}</div>
                ${selectedOutletName ? `<div class="info-row"><span class="info-label">Outlet:</span> ${selectedOutletName}</div>` : ""}
                ${dateFrom ? `<div class="info-row"><span class="info-label">Tanggal Dari:</span> ${dayjs(dateFrom).format("DD MMMM YYYY")}</div>` : ""}
                ${dateTo ? `<div class="info-row"><span class="info-label">Tanggal Sampai:</span> ${dayjs(dateTo).format("DD MMMM YYYY")}</div>` : ""}
                ${status ? `<div class="info-row"><span class="info-label">Status:</span> ${status}</div>` : ""}
                ${pekerjaId && pekerjasData?.data?.find((p: any) => p.id === pekerjaId) ? `<div class="info-row"><span class="info-label">${selectedLaporan === "penjemuran" ? "Penjemur" : "Pengupas"}:</span> ${pekerjasData?.data?.find((p: any) => p.id === pekerjaId)?.nama}</div>` : ""}
                ${pemasokId && pemasoksData?.data?.find((p: any) => p.id === pemasokId) ? `<div class="info-row"><span class="info-label">Pemasok:</span> ${pemasoksData?.data?.find((p: any) => p.id === pemasokId)?.nama}</div>` : ""}
                ${subjekType ? `<div class="info-row"><span class="info-label">Tipe Subjek:</span> ${subjekType === "PEMASOK" ? "Pemasok" : subjekType === "KARYAWAN" ? "Karyawan" : subjekType === "PEKERJA" ? "Pekerja" : subjekType}</div>` : ""}
                ${subjekId && subjekType === "PEMASOK" && pemasoksData?.data?.find((p: any) => p.id === subjekId) ? `<div class="info-row"><span class="info-label">Subjek:</span> ${pemasoksData?.data?.find((p: any) => p.id === subjekId)?.nama}</div>` : ""}
                ${subjekId && subjekType === "KARYAWAN" && karyawansData?.data?.find((k: any) => k.id === subjekId) ? `<div class="info-row"><span class="info-label">Subjek:</span> ${karyawansData?.data?.find((k: any) => k.id === subjekId)?.nama}</div>` : ""}
                ${subjekId && subjekType === "PEKERJA" && pekerjasData?.data?.find((p: any) => p.id === subjekId) ? `<div class="info-row"><span class="info-label">Subjek:</span> ${pekerjasData?.data?.find((p: any) => p.id === subjekId)?.nama}</div>` : ""}
                ${karyawanId && karyawansData?.data?.find((k: any) => k.id === karyawanId) ? `<div class="info-row"><span class="info-label">Karyawan:</span> ${karyawansData?.data?.find((k: any) => k.id === karyawanId)?.nama}</div>` : ""}
                ${!dateFrom && !dateTo && !status && !outletId && !pekerjaId && !pemasokId && !subjekType && !subjekId && !karyawanId ? `<div class="info-row"><span class="info-label">Filter:</span> Semua Data</div>` : ""}
              </div>
            </div>
          </div>

          ${summary ? `
            <div class="summary">
              <h3>Ringkasan</h3>
              <div class="summary-grid">
                ${Object.entries(summary).map(([key, value]) => `
                  <div class="summary-item">
                    <div class="summary-value">${formatSummaryValue(key, value)}</div>
                    <div>${formatSummaryLabel(key)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ""}

          ${renderTableForPrint()}

          <div class="footer">
            <p>Halaman 1 dari 1</p>
            <p>Total Data: ${total}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const renderTableForPrint = () => {
    if (!laporanData || laporanData.length === 0) {
      return "<p>Tidak ada data untuk ditampilkan</p>";
    }

    switch (selectedLaporan) {
      case "mutasi-stok":
        return `
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Produk</th>
                <th>Tipe</th>
                <th>Jumlah</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${dayjs(item.tanggal).format("DD MMM YYYY")}</td>
                  <td>${item.produk?.nama_produk}</td>
                  <td>${item.tipe}</td>
                  <td>${formatDecimal(Number(item.jumlah))} ${item.produk?.satuan}</td>
                  <td>${item.keterangan || "-"}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "penjemuran":
        return `
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Pekerja</th>
                <th>Jumlah Input</th>
                <th>Total Upah</th>
                <th>Jumlah Dibayar</th>
                <th>Metode Pembayaran</th>
                <th>Status</th>
                <th>Tanggal Mulai</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${item.invoice}</td>
                  <td>${item.pekerja?.nama}</td>
                  <td>${formatDecimal(Number(item.produkJumlah))} kg</td>
                  <td>${formatCurrency(Number(item.total_upah || 0))}</td>
                  <td>${formatCurrency(Number(item.jumlahDibayar ?? 0))}</td>
                  <td>${item.isCashless ? "Cashless" : "Tunai"}</td>
                  <td>${item.status}</td>
                  <td>${dayjs(item.tanggal_mulai).format("DD MMM YYYY")}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "pengupasan":
        return `
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Pekerja</th>
                <th>Jumlah Input</th>
                <th>Kemiri Campur</th>
                <th>Total Upah</th>
                <th>Jumlah Dibayar</th>
                <th>Metode Pembayaran</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${item.invoice}</td>
                  <td>${item.pekerja?.nama}</td>
                  <td>${formatDecimal(Number(item.produkJumlah))} kg</td>
                  <td>${formatDecimal(Number(item.kemiri_campur_jumlah || 0))} kg</td>
                  <td>${formatCurrency(Number(item.total_upah || 0))}</td>
                  <td>${formatCurrency(Number(item.jumlahDibayar ?? 0))}</td>
                  <td>${item.isCashless ? "Cashless" : "Tunai"}</td>
                  <td>${item.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "pensortiran":
        return `
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Inspector</th>
                <th>Jumlah Input</th>
                <th>Menir</th>
                <th>Abu</th>
                <th>Keping</th>
                <th>Bulat</th>
                <th>Busuk</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${item.invoice}</td>
                  <td>${item.inspector?.nama}</td>
                  <td>${formatDecimal(Number(item.produkJumlah))} kg</td>
                  <td>${formatDecimal(Number(item.jumlah_menir || 0))} kg</td>
                  <td>${formatDecimal(Number(item.jumlah_abu || 0))} kg</td>
                  <td>${formatDecimal(Number(item.jumlah_keping || 0))} kg</td>
                  <td>${formatDecimal(Number(item.jumlah_bulat || 0))} kg</td>
                  <td>${formatDecimal(Number(item.jumlah_busuk || 0))} kg</td>
                  <td>${item.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "piutang":
        return `
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Total</th>
                <th>Dibayar</th>
                <th>Sisa</th>
                <th>Status</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${item.invoice}</td>
                  <td>${formatCurrency(Number(item.total))}</td>
                  <td>${formatCurrency(Number(item.dibayar))}</td>
                  <td>${formatCurrency(Number(item.total) - Number(item.dibayar))}</td>
                  <td>${item.status}</td>
                  <td>${dayjs(item.tanggal).format("DD MMM YYYY")}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "hutang":
        return `
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Total</th>
                <th>Dibayar</th>
                <th>Sisa</th>
                <th>Status</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${item.invoice}</td>
                  <td>${formatCurrency(Number(item.total))}</td>
                  <td>${formatCurrency(Number(item.dibayar))}</td>
                  <td>${formatCurrency(Number(item.total) - Number(item.dibayar))}</td>
                  <td>${item.status}</td>
                  <td>${dayjs(item.tanggal).format("DD MMM YYYY")}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "absensi":
        return `
          <table>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Tanggal</th>
                <th>Jam Masuk</th>
                <th>Jam Keluar</th>
                <th>Total Jam</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${item.karyawan?.nama}</td>
                  <td>${dayjs(item.tanggal).format("DD MMM YYYY")}</td>
                  <td>${safeTime(item.jam_masuk)}</td>
                  <td>${safeTime(item.jam_keluar)}</td>
                  <td>${formatDecimal(Number(item.total_jam || 0))} jam</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "penggajian":
        return `
          <table>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Periode</th>
                <th>Total Gaji</th>
                <th>Dibayar</th>
                <th>Sisa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${item.karyawan?.nama}</td>
                  <td>${new Date(item.periodeTahun, item.periodeBulan - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</td>
                  <td>${formatCurrency(Number(item.totalGaji))}</td>
                  <td>${formatCurrency(Number(item.dibayar))}</td>
                  <td>${formatCurrency(Number(item.totalGaji) - Number(item.dibayar))}</td>
                  <td>${item.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "pembelian":
        return `
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Pemasok</th>
                <th>Total</th>
                <th>Jumlah Dibayar</th>
                <th>Metode Pembayaran</th>
                <th>Tanggal</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${item.invoice}</td>
                  <td>${item.pemasok?.nama}</td>
                  <td>${formatCurrency(Number(item.total))}</td>
                  <td>${formatCurrency(Number(item.jumlahBayar ?? 0))}</td>
                  <td>${item.isCashless ? "Cashless" : "Tunai"}</td>
                  <td>${dayjs(item.createdAt).format("DD MMM YYYY")}</td>
                  <td>${item.detail?.map((detail: any) => `${detail.produk?.nama_produk}: ${formatDecimal(Number(detail.jumlah))} ${detail.produk?.satuan}`).join(", ") || "-"}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "penjualan":
        return `
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Outlet</th>
                <th>Total</th>
                <th>Tanggal</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${item.invoice}</td>
                  <td>${item.outlet?.nama}</td>
                  <td>${formatCurrency(Number(item.total))}</td>
                  <td>${dayjs(item.createdAt).format("DD MMM YYYY")}</td>
                  <td>${item.detail?.map((detail: any) => `${detail.produk?.nama_produk}: ${formatDecimal(Number(detail.jumlah))} ${detail.produk?.satuan}`).join(", ") || "-"}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "pembayaran":
        return `
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Sumber</th>
                <th>Arus</th>
                <th>Total</th>
                <th>Tipe</th>
                <th>Rekening</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${item.invoice}</td>
                  <td>${item.sumberType}</td>
                  <td>${item.arus}</td>
                  <td>${formatCurrency(Number(item.total))}</td>
                  <td>${item.isCashless ? "Cashless" : "Cash"}</td>
                  <td>${item.rekening?.bank || "-"}</td>
                  <td>${dayjs(item.createdAt).format("DD MMM YYYY")}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "keuangan":
        return `
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Arus</th>
                <th>Total</th>
                <th>Status</th>
                <th>Metode</th>
                <th>Tanggal</th>
                <th>Catatan</th>
                <th>Dibuat Oleh</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${item.invoice}</td>
                  <td>${item.arus}</td>
                  <td>${formatCurrency(Number(item.total))}</td>
                  <td>${item.statusPembayaran || "-"}</td>
                  <td>${item.isCashless ? "Cashless" : "Cash"}</td>
                  <td>${dayjs(item.createdAt).format("DD MMM YYYY")}</td>
                  <td>${item.catatan || "-"}</td>
                  <td>${item.createdBy?.nama || "-"}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "pending-approval":
        return `
          <table>
            <thead>
              <tr>
                <th>Outlet</th>
                <th>Tipe</th>
                <th>Status</th>
                <th>Ringkasan</th>
                <th>Diajukan Oleh</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              ${laporanData.map((item: any) => `
                <tr>
                  <td>${item.outlet?.nama ?? "-"}</td>
                  <td>${item.sumberLabel ?? item.type ?? "-"}</td>
                  <td>${item.status === "PENDING" ? "Menunggu" : item.status === "APPROVED" ? "Disetujui" : item.status === "DIBATALKAN" ? "Dibatalkan" : item.status ?? "-"}</td>
                  <td>${item.displaySummary ?? "-"}</td>
                  <td>${item.createdBy?.nama ?? "-"}</td>
                  <td>${dayjs(item.createdAt).format("DD MMM YYYY HH:mm")}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case "ringkasan":
        const ringkasanData = currentLaporan.data?.data;
        if (!ringkasanData) return "";
        return `
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
            <div style="border: 1px solid #000; padding: 10px;">
              <h3 style="margin-top: 0;">Pembelian</h3>
              <div style="font-size: 16pt; font-weight: bold;">${formatCurrency(ringkasanData.pembelian?.total || 0)}</div>
              <div>${ringkasanData.pembelian?.count || 0} transaksi</div>
            </div>
            <div style="border: 1px solid #000; padding: 10px;">
              <h3 style="margin-top: 0;">Penjualan</h3>
              <div style="font-size: 16pt; font-weight: bold;">${formatCurrency(ringkasanData.penjualan?.total || 0)}</div>
              <div>${ringkasanData.penjualan?.count || 0} transaksi</div>
            </div>
            <div style="border: 1px solid #000; padding: 10px;">
              <h3 style="margin-top: 0;">Produksi</h3>
              <div>Penjemuran: ${ringkasanData.produksi?.penjemuran || 0}</div>
              <div>Pengupasan: ${ringkasanData.produksi?.pengupasan || 0}</div>
              <div>Pensortiran: ${ringkasanData.produksi?.pensortiran || 0}</div>
            </div>
            <div style="border: 1px solid #000; padding: 10px;">
              <h3 style="margin-top: 0;">Keuangan</h3>
              <div>Masuk: ${formatCurrency(ringkasanData.keuangan?.pembayaranMasuk || 0)}</div>
              <div>Keluar: ${formatCurrency(ringkasanData.keuangan?.pembayaranKeluar || 0)}</div>
              <div style="font-weight: bold;">Saldo: ${formatCurrency(ringkasanData.keuangan?.saldo || 0)}</div>
            </div>
            <div style="border: 1px solid #000; padding: 10px;">
              <h3 style="margin-top: 0;">Uang Laci</h3>
              <div>Masuk: ${formatCurrency(ringkasanData.keuangan?.uangLaci?.masuk || 0)}</div>
              <div>Keluar: ${formatCurrency(ringkasanData.keuangan?.uangLaci?.keluar || 0)}</div>
              <div style="font-weight: bold;">Saldo: ${formatCurrency(ringkasanData.keuangan?.uangLaci?.saldo || 0)}</div>
            </div>
            <div style="border: 1px solid #000; padding: 10px;">
              <h3 style="margin-top: 0;">Piutang</h3>
              <div>Total: ${formatCurrency(ringkasanData.keuangan?.piutang?.total || 0)}</div>
              <div>Dibayar: ${formatCurrency(ringkasanData.keuangan?.piutang?.dibayar || 0)}</div>
              <div style="font-weight: bold;">Sisa: ${formatCurrency(ringkasanData.keuangan?.piutang?.sisa || 0)}</div>
            </div>
            <div style="border: 1px solid #000; padding: 10px;">
              <h3 style="margin-top: 0;">Hutang</h3>
              <div>Total: ${formatCurrency(ringkasanData.keuangan?.hutang?.total || 0)}</div>
              <div>Dibayar: ${formatCurrency(ringkasanData.keuangan?.hutang?.dibayar || 0)}</div>
              <div style="font-weight: bold;">Sisa: ${formatCurrency(ringkasanData.keuangan?.hutang?.sisa || 0)}</div>
            </div>
            <div style="border: 1px solid #000; padding: 10px;">
              <h3 style="margin-top: 0;">Penggajian</h3>
              <div>Total: ${formatCurrency(ringkasanData.keuangan?.penggajian?.total || 0)}</div>
              <div>Dibayar: ${formatCurrency(ringkasanData.keuangan?.penggajian?.dibayar || 0)}</div>
              <div style="font-weight: bold;">Sisa: ${formatCurrency(ringkasanData.keuangan?.penggajian?.sisa || 0)}</div>
            </div>
            <div style="border: 1px solid #000; padding: 10px;">
              <h3 style="margin-top: 0;">Mutasi Stok</h3>
              <div style="font-size: 16pt; font-weight: bold;">${ringkasanData.mutasiStok?.count ?? 0}</div>
              <div>transaksi</div>
            </div>
            <div style="border: 1px solid #000; padding: 10px;">
              <h3 style="margin-top: 0;">Menunggu Approval</h3>
              <div style="font-size: 16pt; font-weight: bold;">${ringkasanData.menungguApproval?.count ?? 0}</div>
              <div>transaksi cashless</div>
            </div>
            <div style="border: 1px solid #000; padding: 10px;">
              <h3 style="margin-top: 0;">Absensi</h3>
              <div style="font-size: 16pt; font-weight: bold;">${ringkasanData.absensi?.count ?? 0}</div>
              <div>${formatDecimal(ringkasanData.absensi?.totalJam ?? 0)} jam total</div>
            </div>
          </div>
        `;

      default:
        return "";
    }
  };

  const renderTable = () => {
    if (!laporanData || laporanData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Tidak ada data untuk ditampilkan
        </div>
      );
    }

    switch (selectedLaporan) {
      case "mutasi-stok":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{dayjs(item.tanggal).format("DD MMM YYYY")}</TableCell>
                  <TableCell>{item.produk?.nama_produk}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.tipe === "MASUK"
                          ? "bg-green-500"
                          : item.tipe === "KELUAR"
                          ? "bg-red-500"
                          : ""
                      }
                    >
                      {item.tipe}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDecimal(Number(item.jumlah))} {item.produk?.satuan}
                  </TableCell>
                  <TableCell>{item.keterangan || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "penjemuran":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Pekerja</TableHead>
                <TableHead>Jumlah Input</TableHead>
                <TableHead>Total Upah</TableHead>
                <TableHead>Jumlah Dibayar</TableHead>
                <TableHead>Metode Pembayaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Mulai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.invoice}</TableCell>
                  <TableCell>{item.pekerja?.nama}</TableCell>
                  <TableCell>{formatDecimal(Number(item.produkJumlah))} kg</TableCell>
                  <TableCell>{formatCurrency(Number(item.total_upah || 0))}</TableCell>
                  <TableCell>{formatCurrency(Number(item.jumlahDibayar ?? 0))}</TableCell>
                  <TableCell>{item.isCashless ? "Cashless" : "Tunai"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "SELESAI"
                          ? "bg-green-500"
                          : item.status === "BERJALAN"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{dayjs(item.tanggal_mulai).format("DD MMM YYYY")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "pengupasan":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Pekerja</TableHead>
                <TableHead>Jumlah Input</TableHead>
                <TableHead>Kemiri Campur</TableHead>
                <TableHead>Total Upah</TableHead>
                <TableHead>Jumlah Dibayar</TableHead>
                <TableHead>Metode Pembayaran</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.invoice}</TableCell>
                  <TableCell>{item.pekerja?.nama}</TableCell>
                  <TableCell>{formatDecimal(Number(item.produkJumlah))} kg</TableCell>
                  <TableCell>{formatDecimal(Number(item.kemiri_campur_jumlah || 0))} kg</TableCell>
                  <TableCell>{formatCurrency(Number(item.total_upah || 0))}</TableCell>
                  <TableCell>{formatCurrency(Number(item.jumlahDibayar ?? 0))}</TableCell>
                  <TableCell>{item.isCashless ? "Cashless" : "Tunai"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "SELESAI"
                          ? "bg-green-500"
                          : item.status === "BERJALAN"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "pensortiran":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Jumlah Input</TableHead>
                <TableHead>Menir</TableHead>
                <TableHead>Abu</TableHead>
                <TableHead>Keping</TableHead>
                <TableHead>Bulat</TableHead>
                <TableHead>Busuk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.invoice}</TableCell>
                  <TableCell>{item.inspector?.nama}</TableCell>
                  <TableCell>{formatDecimal(Number(item.produkJumlah))} kg</TableCell>
                  <TableCell>{formatDecimal(Number(item.jumlah_menir || 0))} kg</TableCell>
                  <TableCell>{formatDecimal(Number(item.jumlah_abu || 0))} kg</TableCell>
                  <TableCell>{formatDecimal(Number(item.jumlah_keping || 0))} kg</TableCell>
                  <TableCell>{formatDecimal(Number(item.jumlah_bulat || 0))} kg</TableCell>
                  <TableCell>{formatDecimal(Number(item.jumlah_busuk || 0))} kg</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "SELESAI"
                          ? "bg-green-500"
                          : item.status === "BERJALAN"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "piutang":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Dibayar</TableHead>
                <TableHead>Sisa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.invoice}</TableCell>
                  <TableCell>{formatCurrency(Number(item.total))}</TableCell>
                  <TableCell>{formatCurrency(Number(item.dibayar))}</TableCell>
                  <TableCell>
                    {formatCurrency(Number(item.total) - Number(item.dibayar))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.status}</Badge>
                  </TableCell>
                  <TableCell>{dayjs(item.tanggal).format("DD MMM YYYY")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "hutang":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Dibayar</TableHead>
                <TableHead>Sisa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.invoice}</TableCell>
                  <TableCell>{formatCurrency(Number(item.total))}</TableCell>
                  <TableCell>{formatCurrency(Number(item.dibayar))}</TableCell>
                  <TableCell>
                    {formatCurrency(Number(item.total) - Number(item.dibayar))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.status}</Badge>
                  </TableCell>
                  <TableCell>{dayjs(item.tanggal).format("DD MMM YYYY")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "absensi":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Keluar</TableHead>
                <TableHead>Total Jam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.karyawan?.nama}</TableCell>
                  <TableCell>{dayjs(item.tanggal).format("DD MMM YYYY")}</TableCell>
                  <TableCell>{safeTime(item.jam_masuk)}</TableCell>
                  <TableCell>
                    {safeTime(item.jam_keluar)}
                  </TableCell>
                  <TableCell>{formatDecimal(Number(item.total_jam || 0))} jam</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "penggajian":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Total Gaji</TableHead>
                <TableHead>Dibayar</TableHead>
                <TableHead>Sisa</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.karyawan?.nama}</TableCell>
                  <TableCell>
                    {new Date(item.periodeTahun, item.periodeBulan - 1).toLocaleDateString("id-ID", {
                      month: "long",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{formatCurrency(Number(item.totalGaji))}</TableCell>
                  <TableCell>{formatCurrency(Number(item.dibayar))}</TableCell>
                  <TableCell>
                    {formatCurrency(Number(item.totalGaji) - Number(item.dibayar))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "pembelian":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Pemasok</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Jumlah Dibayar</TableHead>
                <TableHead>Metode Pembayaran</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.invoice}</TableCell>
                  <TableCell>{item.pemasok?.nama}</TableCell>
                  <TableCell>{formatCurrency(Number(item.total))}</TableCell>
                  <TableCell>{formatCurrency(Number(item.jumlahBayar ?? 0))}</TableCell>
                  <TableCell>{item.isCashless ? "Cashless" : "Tunai"}</TableCell>
                  <TableCell>{dayjs(item.createdAt).format("DD MMM YYYY")}</TableCell>
                  <TableCell>
                    {item.detail?.map((detail: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        {detail.produk?.nama_produk}: {formatDecimal(Number(detail.jumlah))}{" "}
                        {detail.produk?.satuan}
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "penjualan":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.invoice}</TableCell>
                  <TableCell>{item.outlet?.nama}</TableCell>
                  <TableCell>{formatCurrency(Number(item.total))}</TableCell>
                  <TableCell>{dayjs(item.createdAt).format("DD MMM YYYY")}</TableCell>
                  <TableCell>
                    {item.detail?.map((detail: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        {detail.produk?.nama_produk}: {formatDecimal(Number(detail.jumlah))}{" "}
                        {detail.produk?.satuan}
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "pembayaran":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead>Arus</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Rekening</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.invoice}</TableCell>
                  <TableCell>{item.sumberType}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.arus === "MASUK" ? "bg-green-500" : "bg-red-500"
                      }
                    >
                      {item.arus}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(Number(item.total))}</TableCell>
                  <TableCell>{item.isCashless ? "Cashless" : "Cash"}</TableCell>
                  <TableCell>{item.rekening?.bank || "-"}</TableCell>
                  <TableCell>{dayjs(item.createdAt).format("DD MMM YYYY")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "keuangan":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Arus</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Dibuat Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.invoice}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.arus === "MASUK" ? "bg-green-500" : "bg-red-500"
                      }
                    >
                      {item.arus}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(Number(item.total))}</TableCell>
                  <TableCell>{item.statusPembayaran || "-"}</TableCell>
                  <TableCell>{item.isCashless ? "Cashless" : "Cash"}</TableCell>
                  <TableCell>{dayjs(item.createdAt).format("DD MMM YYYY")}</TableCell>
                  <TableCell>{item.catatan || "-"}</TableCell>
                  <TableCell>{item.createdBy?.nama || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "pending-approval":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Outlet</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ringkasan</TableHead>
                <TableHead>Diajukan Oleh</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.outlet?.nama ?? "-"}</TableCell>
                  <TableCell>{item.sumberLabel ?? item.type ?? "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "PENDING"
                          ? "bg-amber-500"
                          : item.status === "APPROVED"
                            ? "bg-green-500"
                            : "bg-muted"
                      }
                    >
                      {item.status === "PENDING"
                        ? "Menunggu"
                        : item.status === "APPROVED"
                          ? "Disetujui"
                          : item.status ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate" title={item.displaySummary}>
                    {item.displaySummary ?? "-"}
                  </TableCell>
                  <TableCell>{item.createdBy?.nama ?? "-"}</TableCell>
                  <TableCell>{dayjs(item.createdAt).format("DD MMM YYYY HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "ringkasan":
        const ringkasanData = currentLaporan.data?.data;
        if (!ringkasanData) return null;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
            <Card>
              <CardHeader>
                <CardTitle>Pembelian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(ringkasanData.pembelian?.total || 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {ringkasanData.pembelian?.count || 0} transaksi
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Penjualan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(ringkasanData.penjualan?.total || 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {ringkasanData.penjualan?.count || 0} transaksi
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Produksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Penjemuran: {ringkasanData.produksi?.penjemuran || 0}</div>
                  <div>Pengupasan: {ringkasanData.produksi?.pengupasan || 0}</div>
                  <div>Pensortiran: {ringkasanData.produksi?.pensortiran || 0}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Keuangan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Masuk: {formatCurrency(ringkasanData.keuangan?.pembayaranMasuk || 0)}</div>
                  <div>Keluar: {formatCurrency(ringkasanData.keuangan?.pembayaranKeluar || 0)}</div>
                  <div className="font-semibold">
                    Saldo: {formatCurrency(ringkasanData.keuangan?.saldo || 0)}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Uang Laci (Keuangan)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Masuk: {formatCurrency(ringkasanData.keuangan?.uangLaci?.masuk || 0)}</div>
                  <div>Keluar: {formatCurrency(ringkasanData.keuangan?.uangLaci?.keluar || 0)}</div>
                  <div className="font-semibold">
                    Saldo: {formatCurrency(ringkasanData.keuangan?.uangLaci?.saldo || 0)}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Piutang</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Total: {formatCurrency(ringkasanData.keuangan?.piutang?.total || 0)}</div>
                  <div>Dibayar: {formatCurrency(ringkasanData.keuangan?.piutang?.dibayar || 0)}</div>
                  <div className="font-semibold">
                    Sisa: {formatCurrency(ringkasanData.keuangan?.piutang?.sisa || 0)}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Hutang</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Total: {formatCurrency(ringkasanData.keuangan?.hutang?.total || 0)}</div>
                  <div>Dibayar: {formatCurrency(ringkasanData.keuangan?.hutang?.dibayar || 0)}</div>
                  <div className="font-semibold">
                    Sisa: {formatCurrency(ringkasanData.keuangan?.hutang?.sisa || 0)}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Penggajian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Total: {formatCurrency(ringkasanData.keuangan?.penggajian?.total || 0)}</div>
                  <div>Dibayar: {formatCurrency(ringkasanData.keuangan?.penggajian?.dibayar || 0)}</div>
                  <div className="font-semibold">
                    Sisa: {formatCurrency(ringkasanData.keuangan?.penggajian?.sisa || 0)}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mutasi Stok</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ringkasanData.mutasiStok?.count ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">transaksi</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Menunggu Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ringkasanData.menungguApproval?.count ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">transaksi cashless</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Absensi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ringkasanData.absensi?.count ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDecimal(ringkasanData.absensi?.totalJam ?? 0)} jam total
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laporan</h1>
          <p className="text-muted-foreground">
            Laporan lengkap untuk semua data di sistem
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
         
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>Pilih jenis laporan dan filter yang diinginkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Jenis Laporan</label>
              <Select value={selectedLaporan} onValueChange={(value) => setSelectedLaporan(value as LaporanType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih laporan" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(
                    visibleLaporanTypes.reduce((acc, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);
                      return acc;
                    }, {} as Record<string, typeof visibleLaporanTypes>)
                  ).map(([category, items]) => (
                    <div key={category}>
                     
                      {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tanggal Dari</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDateFrom ? dayjs(filterDateFrom).format("DD MMM YYYY") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filterDateFrom}
                    onSelect={setFilterDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tanggal Sampai</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDateTo ? dayjs(filterDateTo).format("DD MMM YYYY") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filterDateTo}
                    onSelect={setFilterDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filter Outlet - hanya untuk OWNER */}
            {isOwner && (
              <div>
                <label className="text-sm font-medium mb-2 block">Outlet</label>
                <Select
                  value={filterOutletId || "__all__"}
                  onValueChange={(v) => setFilterOutletId(v === "__all__" ? "" : v)}
                >
                  <SelectTrigger className="w-full">
                      <SelectValue>
                      {filterOutletId && outletsData?.data?.find((o) => o.id === filterOutletId)?.nama || "Semua Outlet"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Semua Outlet</SelectItem>
                    {outletsData?.data?.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id}>
                        {outlet.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Filter Penjemur (Laporan Penjemuran) / Pengupas (Laporan Pengupasan) / Pemasok (Laporan Pembelian) */}
            {(selectedLaporan === "penjemuran" || selectedLaporan === "pengupasan" || selectedLaporan === "pembelian") && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {selectedLaporan === "penjemuran"
                    ? "Penjemur (Pekerja)"
                    : selectedLaporan === "pengupasan"
                    ? "Pengupas (Pekerja)"
                    : "Pemasok"}
                </label>
                {selectedLaporan === "pembelian" ? (
                  <Select
                    value={filterPemasokId || "__all__"}
                    onValueChange={(v) => setFilterPemasokId(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {filterPemasokId && pemasoksData?.data?.find((p) => p.id === filterPemasokId)?.nama || "Semua Pemasok"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Semua Pemasok</SelectItem>
                      {pemasoksData?.data?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={filterPekerjaId || "__all__"}
                    onValueChange={(v) => setFilterPekerjaId(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {filterPekerjaId && pekerjasData?.data?.find((p) => p.id === filterPekerjaId)?.nama || "Semua Pekerja"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Semua Pekerja</SelectItem>
                      {pekerjasData?.data?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Filter Hutang / Piutang: Tipe Subjek + Subjek (Pemasok / Karyawan / Pekerja) */}
            {(selectedLaporan === "hutang" || selectedLaporan === "piutang") && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipe Subjek</label>
                  <Select
                    value={filterSubjekType || "__all__"}
                    onValueChange={(v) => {
                      setFilterSubjekType(v === "__all__" ? "" : v);
                      setFilterSubjekId("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {filterSubjekType === "PEMASOK"
                          ? "Pemasok"
                          : filterSubjekType === "KARYAWAN"
                          ? "Karyawan"
                          : filterSubjekType === "PEKERJA"
                          ? "Pekerja"
                          : "Semua"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Semua</SelectItem>
                      {selectedLaporan === "hutang" && (
                        <SelectItem value="PEMASOK">Pemasok</SelectItem>
                      )}
                      <SelectItem value="KARYAWAN">Karyawan</SelectItem>
                      <SelectItem value="PEKERJA">Pekerja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Subjek</label>
                  <Select
                    value={filterSubjekId || "__all__"}
                    onValueChange={(v) => setFilterSubjekId(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {filterSubjekType === "PEMASOK" && filterSubjekId
                          ? pemasoksData?.data?.find((p) => p.id === filterSubjekId)?.nama || "Semua"
                          : filterSubjekType === "KARYAWAN" && filterSubjekId
                          ? karyawansData?.data?.find((k) => k.id === filterSubjekId)?.nama || "Semua"
                          : filterSubjekType === "PEKERJA" && filterSubjekId
                          ? pekerjasData?.data?.find((p) => p.id === filterSubjekId)?.nama || "Semua"
                          : "Semua"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Semua</SelectItem>
                      {filterSubjekType === "PEMASOK" &&
                        pemasoksData?.data?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nama}
                          </SelectItem>
                        ))}
                      {filterSubjekType === "KARYAWAN" &&
                        karyawansData?.data?.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.nama}
                          </SelectItem>
                        ))}
                      {filterSubjekType === "PEKERJA" &&
                        pekerjasData?.data?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nama}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Filter Penggajian: Karyawan */}
            {selectedLaporan === "penggajian" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Karyawan</label>
                <Select
                  value={filterKaryawanId || "__all__"}
                  onValueChange={(v) => setFilterKaryawanId(v === "__all__" ? "" : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {filterKaryawanId && karyawansData?.data?.find((k) => k.id === filterKaryawanId)?.nama || "Semua Karyawan"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Semua Karyawan</SelectItem>
                    {karyawansData?.data?.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilter} className="w-full sm:w-auto">
              Terapkan Filter
            </Button>
            <Button onClick={handleResetFilter} variant="outline" className="w-full sm:w-auto">
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold tabular-nums">
                    {formatSummaryValue(key, value)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatSummaryLabel(key)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {laporanTypes.find((t) => t.value === selectedLaporan)?.label || "Laporan"}
              </CardTitle>
              <CardDescription>
                Total: {total} data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentLaporan.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : currentLaporan.error ? (
            <div className="text-center py-8 text-destructive">
              Error: {currentLaporan.error.message}
            </div>
          ) : (
            <div className="overflow-x-auto">{renderTable()}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
