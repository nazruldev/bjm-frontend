"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { usePenggajianByKaryawan } from "@/hooks/usePenggajianNew";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Calendar, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
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

export default function PenggajianKaryawanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const karyawanId = params.karyawanId as string;

  // State untuk filter periode
  const [periodeDari, setPeriodeDari] = React.useState<Date | undefined>(undefined);
  const [periodeSampai, setPeriodeSampai] = React.useState<Date | undefined>(undefined);

  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = usePenggajianByKaryawan(karyawanId, {
    periodeBulan: periodeDari?.getMonth() !== undefined ? periodeDari.getMonth() + 1 : undefined,
    periodeTahun: periodeDari?.getFullYear(),
  });
  
  // Flatten pages data
  const penggajianList = React.useMemo(() => {
    if (!data?.pages || !Array.isArray(data.pages)) return [];
    return data.pages.flatMap((page: any) => {
      if (!page || !page.data || !Array.isArray(page.data)) return [];
      return page.data;
    });
  }, [data]);

  // Calculate totals
  const totals = React.useMemo(() => {
    if (!penggajianList || penggajianList.length === 0) {
      return { totalGaji: 0, totalDibayar: 0, totalSisa: 0 };
    }
    
    return penggajianList.reduce(
      (acc, p) => ({
        totalGaji: acc.totalGaji + p.totalGaji,
        totalDibayar: acc.totalDibayar + p.dibayar,
        totalSisa: acc.totalSisa + (p.totalGaji - p.dibayar),
      }),
      { totalGaji: 0, totalDibayar: 0, totalSisa: 0 }
    );
  }, [penggajianList]);

  // Infinite scroll observer
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  if (!penggajianList || penggajianList.length === 0) {
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
            Belum ada data penggajian untuk karyawan ini
          </CardContent>
        </Card>
      </div>
    );
  }

  const karyawan = penggajianList[0]?.karyawan;

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
              {karyawan?.nama || "Karyawan"}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Gaji</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalGaji)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Dibayar</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalDibayar)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sisa</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalSisa)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List Penggajian */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Riwayat Penggajian</CardTitle>
              <CardDescription>
                Daftar penggajian dan pembayaran untuk karyawan ini
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {periodeDari ? dayjs(periodeDari).format("DD MMMM YYYY") : "Dari"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={periodeDari}
                    onSelect={setPeriodeDari}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {periodeSampai ? dayjs(periodeSampai).format("DD MMMM YYYY") : "Sampai"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={periodeSampai}
                    onSelect={setPeriodeSampai}
                    disabled={(date) => {
                      if (periodeDari) {
                        return date < periodeDari;
                      }
                      return false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {(periodeDari || periodeSampai) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPeriodeDari(undefined);
                    setPeriodeSampai(undefined);
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Keluar</TableHead>
                <TableHead>Total Jam</TableHead>
                <TableHead>Total Gaji</TableHead>
                <TableHead>Dibayar</TableHead>
                <TableHead>Sisa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pembayaran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {penggajianList.map((penggajian) => (
                <React.Fragment key={penggajian.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {formatDate(penggajian.periodeDari)} - {formatDate(penggajian.periodeSampai)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {penggajian.absensi && penggajian.absensi.length > 0 ? (
                        <div className="text-sm space-y-1">
                          {penggajian.absensi.map((absensi: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Clock className="size-3 text-muted-foreground" />
                              <span>
                                {absensi.jam_masuk
                                  ? dayjs(absensi.jam_masuk).format("HH:mm")
                                  : "-"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {penggajian.absensi && penggajian.absensi.length > 0 ? (
                        <div className="text-sm space-y-1">
                          {penggajian.absensi.map((absensi: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Clock className="size-3 text-muted-foreground" />
                              <span>
                                {absensi.jam_keluar
                                  ? dayjs(absensi.jam_keluar).format("HH:mm")
                                  : "-"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {penggajian.totalJam !== undefined ? (
                        <Badge variant="outline">
                          {formatDecimal(Number(penggajian.totalJam))} jam
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(penggajian.totalGaji)}
                    </TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      {formatCurrency(penggajian.dibayar)}
                    </TableCell>
                    <TableCell className="text-red-600 font-semibold">
                      {formatCurrency(penggajian.totalGaji - penggajian.dibayar)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          penggajian.status === "LUNAS"
                            ? "default"
                            : penggajian.status === "PARTIAL"
                            ? "secondary"
                            : "destructive"
                        }
                        className="flex items-center gap-1 w-fit"
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
                    </TableCell>
                    <TableCell>
                      {penggajian.pembayaran && penggajian.pembayaran.length > 0 ? (
                        <div className="text-sm">
                          {penggajian.pembayaran.length} pembayaran
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {/* Detail Pembayaran */}
                  {penggajian.pembayaran && penggajian.pembayaran.length > 0 && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={9}>
                        <div className="space-y-2 pl-8">
                          <div className="text-sm font-medium">Detail Pembayaran:</div>
                          {penggajian.pembayaran.map((pembayaran: any) => (
                            <div
                              key={pembayaran.id}
                              className="flex items-center justify-between text-sm bg-background p-2 rounded border"
                            >
                              <div className="flex items-center gap-4">
                                <div>
                                  <div className="font-medium">{pembayaran.invoice}</div>
                                  <div className="text-muted-foreground">
                                    {formatDate(pembayaran.createdAt)}
                                  </div>
                                </div>
                                <div>
                                  <Badge variant={pembayaran.arus === "MASUK" ? "default" : "destructive"}>
                                    {pembayaran.arus}
                                  </Badge>
                                </div>
                                {pembayaran.rekening && (
                                  <div className="text-muted-foreground">
                                    {pembayaran.rekening.bank} - {pembayaran.rekening.nama}
                                  </div>
                                )}
                              </div>
                              <div className="font-semibold">
                                {formatCurrency(pembayaran.total)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="py-4 text-center">
            {isFetchingNextPage && (
              <div className="text-sm text-muted-foreground">Memuat data...</div>
            )}
            {!hasNextPage && penggajianList.length > 0 && (
              <div className="text-sm text-muted-foreground">Semua data telah dimuat</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

