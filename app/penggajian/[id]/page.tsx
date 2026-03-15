"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { usePenggajianById } from "@/hooks/usePenggajianNew";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Calendar, Clock, Printer, ExternalLink } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { formatDate, formatCurrency, formatDecimal } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PenggajianDetailPage() {
  const params = useParams();
  const router = useRouter();
  const penggajianId = params.id as string;

  const { 
    data: penggajian, 
    isLoading, 
    error 
  } = usePenggajianById(penggajianId);

  // Calculate totals from absensi
  const absensiSummary = React.useMemo(() => {
    if (!penggajian?.absensi || penggajian.absensi.length === 0) {
      return { 
        totalHari: 0, 
        totalJam: 0,
        rataRataJam: 0
      };
    }
    
    const totalHari = penggajian.absensi.length;
    const totalJam = penggajian.absensi.reduce((sum: number, absensi: any) => {
      return sum + Number(absensi.total_jam || 0);
    }, 0);
    const rataRataJam = totalHari > 0 ? totalJam / totalHari : 0;

    return { totalHari, totalJam, rataRataJam };
  }, [penggajian]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data penggajian"}
        </div>
      </div>
    );
  }

  if (!penggajian) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 size-4" />
          Kembali
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Data penggajian tidak ditemukan
          </CardContent>
        </Card>
      </div>
    );
  }

  const karyawan = penggajian.karyawan;
  const periodeLabel = dayjs().month((penggajian.periodeBulan || 1) - 1).format("MMMM") + " " + penggajian.periodeTahun;
  const sisa = Number(penggajian.totalGaji) - Number(penggajian.dibayar);

  /** Tanggal aman: string YYYY-MM-DD atau Date/ISO → tampilan; selain itu "-" */
  const safeDate = (d: string | Date | null | undefined) => (d ? formatDate(d) : "-");
  /** Jam tampil: kalau sudah "HH:mm" tampilkan langsung, bukan lewat dayjs */
  const safeTime = (t: string | null | undefined) => {
    if (!t) return "-";
    if (/^\d{1,2}:\d{2}$/.test(String(t).trim())) return String(t).trim();
    try {
      const parsed = dayjs(t);
      return parsed.isValid() ? parsed.format("HH:mm") : "-";
    } catch {
      return "-";
    }
  };

  const handlePrintSlipGaji = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const currentDate = dayjs().format("DD MMMM YYYY HH:mm");
    const periodeDariStr = penggajian.periodeDari
      ? (typeof penggajian.periodeDari === "string"
          ? dayjs(penggajian.periodeDari).format("DD MMMM YYYY")
          : dayjs(penggajian.periodeDari).format("DD MMMM YYYY"))
      : dayjs().month((penggajian.periodeBulan || 1) - 1).date(1).format("DD MMMM YYYY");
    const periodeSampaiStr = penggajian.periodeSampai
      ? (typeof penggajian.periodeSampai === "string"
          ? dayjs(penggajian.periodeSampai).format("DD MMMM YYYY")
          : dayjs(penggajian.periodeSampai).format("DD MMMM YYYY"))
      : dayjs().month((penggajian.periodeBulan || 1) - 1).endOf("month").format("DD MMMM YYYY");

    const absensiRows =
      penggajian.absensi && penggajian.absensi.length > 0
        ? penggajian.absensi
            .map(
              (a: any) => `
              <tr>
                <td>${safeDate(a.tanggal)}</td>
                <td>${safeTime(a.jam_masuk)}</td>
                <td>${safeTime(a.jam_keluar)}</td>
                <td>${a.total_jam != null ? formatDecimal(Number(a.total_jam)) + " jam" : "-"}</td>
                <td>${a.catatan || "-"}</td>
              </tr>`
            )
            .join("")
        : "<tr><td colspan=\"5\" style=\"text-align:center;\">Tidak ada data absensi</td></tr>";

    const pembayaranRows =
      penggajian.pembayaran && penggajian.pembayaran.length > 0
        ? penggajian.pembayaran
            .map(
              (p: any) => `
              <tr>
                <td>${p.invoice || "-"}</td>
                <td>${safeDate(p.createdAt)}</td>
                <td>${p.arus || "-"}</td>
                <td>${p.rekening ? p.rekening.bank + " - " + (p.rekening.nama || "") : "-"}</td>
                <td>Rp ${formatCurrency(Number(p.total))}</td>
              </tr>`
            )
            .join("")
        : "<tr><td colspan=\"5\" style=\"text-align:center;\">Belum ada pembayaran</td></tr>";

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Slip Gaji - ${karyawan?.nama || "Karyawan"}</title>
          <style>
            @media print {
              @page {
                margin: 1.5cm;
                size: A4;
              }
              body { font-family: Arial, sans-serif; font-size: 10pt; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              font-size: 11pt;
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
              border-bottom: 2px solid #000;
              padding-bottom: 12px;
            }
            .header h1 { margin: 0; font-size: 20pt; }
            .header p { margin: 6px 0; font-size: 10pt; }
            .info {
              margin-bottom: 20px;
              padding: 12px;
              border: 1px solid #ddd;
              background-color: #f9f9f9;
              font-size: 10pt;
            }
            .info-row { margin-bottom: 6px; }
            .info-label { font-weight: bold; display: inline-block; min-width: 140px; }
            .summary {
              margin: 20px 0;
              padding: 14px;
              border: 1px solid #000;
              background-color: #f5f5f5;
            }
            .summary h3 { margin-top: 0; margin-bottom: 12px; font-size: 12pt; }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
            }
            .summary-item { text-align: center; }
            .summary-value { font-size: 13pt; font-weight: bold; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
              font-size: 9pt;
            }
            th, td {
              border: 1px solid #000;
              padding: 6px 8px;
              text-align: left;
            }
            th { background-color: #e8e8e8; font-weight: bold; }
            .section-title { margin-top: 24px; margin-bottom: 8px; font-size: 12pt; font-weight: bold; }
            .footer {
              margin-top: 28px;
              text-align: center;
              font-size: 9pt;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SLIP GAJI</h1>
            <p>BJM - Kotamobagu</p>
            <p>Dicetak pada: ${currentDate}</p>
          </div>
          <div class="info">
            <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 12pt;">Data Karyawan & Periode</h3>
            <div class="info-row"><span class="info-label">Nama Karyawan:</span> ${karyawan?.nama || "-"}</div>
            <div class="info-row"><span class="info-label">No. Telepon:</span> ${karyawan?.telepon || "-"}</div>
            <div class="info-row"><span class="info-label">Periode:</span> ${periodeLabel}</div>
            <div class="info-row"><span class="info-label">Rentang:</span> ${periodeDariStr} s/d ${periodeSampaiStr}</div>
            <div class="info-row"><span class="info-label">Golongan Gaji:</span> ${karyawan?.gaji?.nama || "-"}</div>
          </div>
          <div class="summary">
            <h3>Ringkasan</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value">Rp ${formatCurrency(Number(penggajian.totalGaji))}</div>
                <div>Total Gaji</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">Rp ${formatCurrency(Number(penggajian.dibayar))}</div>
                <div>Total Dibayar</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">Rp ${formatCurrency(sisa)}</div>
                <div>Sisa</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${penggajian.status || "-"}</div>
                <div>Status</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${absensiSummary.totalHari} hari</div>
                <div>Total Hari Masuk</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${formatDecimal(absensiSummary.totalJam)} jam</div>
                <div>Total Jam Kerja</div>
              </div>
            </div>
          </div>
          <p class="section-title">Detail Absensi</p>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jam Masuk</th>
                <th>Jam Keluar</th>
                <th>Total Jam</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>${absensiRows}</tbody>
          </table>
          <p class="section-title">Detail Pembayaran</p>
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Tanggal</th>
                <th>Arus</th>
                <th>Rekening</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${pembayaranRows}</tbody>
          </table>
          <div class="footer">
            <p>Halaman 1 dari 1</p>
            <p>Dokumen ini sah sebagai slip gaji periode ${periodeLabel}</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 size-4" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Detail Penggajian
            </h1>
            <p className="text-muted-foreground mt-2">
              {karyawan?.nama || "Karyawan"} - {periodeLabel}
            </p>
          </div>
        </div>
        <Button onClick={handlePrintSlipGaji} variant="outline">
          <Printer className="mr-2 size-4" />
          Print Slip Gaji
        </Button>
      </div>

      {/* Summary Penggajian */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Penggajian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Gaji</p>
              <p className="text-2xl font-bold">{formatCurrency(penggajian.totalGaji)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Dibayar</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(penggajian.dibayar)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sisa</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(penggajian.totalGaji - penggajian.dibayar)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={
                  penggajian.status === "LUNAS"
                    ? "default"
                    : penggajian.status === "PARTIAL"
                    ? "secondary"
                    : "destructive"
                }
                className="flex items-center gap-1 w-fit mt-2"
              >
                {penggajian.status === "LUNAS" ? (
                  <CheckCircle2 className="size-3" />
                ) : penggajian.status === "PARTIAL" ? (
                  <AlertCircle className="size-3" />
                ) : (
                  <XCircle className="size-3" />
                )}
                {penggajian.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ringkasan Absensi */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Absensi</CardTitle>
          <CardDescription>
            Periode: {safeDate(penggajian.periodeDari) !== "-"
              ? safeDate(penggajian.periodeDari)
              : dayjs().month((penggajian.periodeBulan || 1) - 1).date(1).format("DD MMMM YYYY")}{" "}
            - {safeDate(penggajian.periodeSampai) !== "-"
              ? safeDate(penggajian.periodeSampai)
              : dayjs().month((penggajian.periodeBulan || 1) - 1).endOf("month").format("DD MMMM YYYY")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Hari Masuk</p>
              <p className="text-2xl font-bold">{absensiSummary.totalHari} hari</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Jam Kerja</p>
              <p className="text-2xl font-bold">{formatDecimal(absensiSummary.totalJam)} jam</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rata-rata Jam/Hari</p>
              <p className="text-2xl font-bold">{formatDecimal(absensiSummary.rataRataJam)} jam</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Absensi */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Absensi</CardTitle>
          <CardDescription>
            Daftar absensi untuk periode ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {penggajian.absensi && penggajian.absensi.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam Masuk</TableHead>
                  <TableHead>Jam Keluar</TableHead>
                  <TableHead>Total Jam</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penggajian.absensi.map((absensi: any) => (
                  <TableRow key={absensi.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <span className="font-medium">{safeDate(absensi.tanggal)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="size-3 text-muted-foreground" />
                        <span>{safeTime(absensi.jam_masuk)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="size-3 text-muted-foreground" />
                        <span>{safeTime(absensi.jam_keluar)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {absensi.total_jam !== null && absensi.total_jam !== undefined ? (
                        <Badge variant="outline">
                          {formatDecimal(Number(absensi.total_jam))} jam
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {absensi.catatan || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Tidak ada data absensi untuk periode ini
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Pembayaran - tabel seperti laporan, baris linked ke detail pembayaran */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Pembayaran</CardTitle>
          <CardDescription>
            Riwayat pembayaran untuk penggajian ini. Klik baris untuk ke detail pembayaran.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {penggajian.pembayaran && penggajian.pembayaran.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Arus</TableHead>
                    <TableHead>Rekening</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penggajian.pembayaran.map((pembayaran: any) => (
                    <TableRow key={pembayaran.id} className="group">
                      <TableCell>
                        <Link
                          href={`/pembayaran/${pembayaran.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {pembayaran.invoice}
                        </Link>
                      </TableCell>
                      <TableCell>{safeDate(pembayaran.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={pembayaran.arus === "MASUK" ? "default" : "destructive"}>
                          {pembayaran.arus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {pembayaran.rekening
                          ? `${pembayaran.rekening.bank} - ${pembayaran.rekening.nama || ""}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(pembayaran.total)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/pembayaran/${pembayaran.id}`}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="size-3" />
                          Detail
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Belum ada pembayaran untuk penggajian ini
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
