"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ShoppingCart,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Package,
  TrendingUp,
  AlertCircle,
  Activity,
  DollarSign,
  FileText,
  ClipboardCheck,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePembelianSummary } from "@/hooks/usePembelians";
import { usePenjualanSummary } from "@/hooks/usePenjualans";
import { usePembayaranSummary } from "@/hooks/usePembayarans";
import { usePembelians } from "@/hooks/usePembelians";
import { usePenjualans } from "@/hooks/usePenjualans";
import { usePembayarans } from "@/hooks/usePembayarans";
import { usePenjemurans } from "@/hooks/usePenjemurans";
import { usePengupasans } from "@/hooks/usePengupasans";
import { usePensortirans } from "@/hooks/usePensortirans";
import { useHutangs } from "@/hooks/useHutangs";
import { usePiutangs } from "@/hooks/usePiutangs";
import { useKeuangans } from "@/hooks/useKeuangans";
import { useAbsensis } from "@/hooks/useAbsensis";
import { useKaryawans } from "@/hooks/useKaryawans";
import { useSyncAbsensiManual } from "@/hooks/useSyncAbsensiLogs";
import { useOutlets } from "@/hooks/useOutlets";
import { formatCurrency } from "@/lib/utils";
import dayjs from "@/lib/dayjs";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

type PeriodType = "today" | "week" | "month" | "year";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [period, setPeriod] = React.useState<PeriodType>("today");
  const isOwner = user?.role === "OWNER";
  const isInspector = user?.role === "INSPECTOR";

  const { data: outletsData, isLoading: loadingOutlets } = useOutlets(
    { limit: 1000 },
    { enabled: !!isOwner }
  );

  // OWNER tanpa outlet: alihkan ke halaman outlet, form buat outlet perdana akan otomatis terbuka
  React.useEffect(() => {
    if (!isOwner || loadingOutlets || outletsData === undefined) return;
    if ((outletsData?.data?.length ?? 0) === 0) {
      router.replace("/outlet");
    }
  }, [isOwner, loadingOutlets, outletsData, router]);

  // OWNER: hanya render dashboard penuh jika sudah ada outlet (hindari 401 dari hooks yang butuh outlet)
  const ownerHasNoOutlets = isOwner && !loadingOutlets && (outletsData?.data?.length ?? 0) === 0;
  if (isOwner && (loadingOutlets || ownerHasNoOutlets)) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return <DashboardContent />;
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [period, setPeriod] = React.useState<PeriodType>("today");
  const isOwner = user?.role === "OWNER";
  const isInspector = user?.role === "INSPECTOR";

  // Calculate date range berdasarkan period
  const dateRange = React.useMemo(() => {
    const now = dayjs();
    switch (period) {
      case "today":
        return {
          dateFrom: now.startOf("day").format("YYYY-MM-DD"),
          dateTo: now.endOf("day").format("YYYY-MM-DD"),
          label: "Hari Ini",
        };
      case "week":
        return {
          dateFrom: now.startOf("week").format("YYYY-MM-DD"),
          dateTo: now.endOf("week").format("YYYY-MM-DD"),
          label: "Minggu Ini",
        };
      case "month":
        return {
          dateFrom: now.startOf("month").format("YYYY-MM-DD"),
          dateTo: now.endOf("month").format("YYYY-MM-DD"),
          label: "Bulan Ini",
        };
      case "year":
        return {
          dateFrom: now.startOf("year").format("YYYY-MM-DD"),
          dateTo: now.endOf("year").format("YYYY-MM-DD"),
          label: "Tahun Ini",
        };
      default:
        return {
          dateFrom: now.startOf("day").format("YYYY-MM-DD"),
          dateTo: now.endOf("day").format("YYYY-MM-DD"),
          label: "Hari Ini",
        };
    }
  }, [period]);

  // Summary & keuangan hanya untuk OWNER (Inspector tidak fetch)
  const { data: pembelianSummary, isLoading: loadingPembelian } = usePembelianSummary(
    { dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo },
    { enabled: !isInspector }
  );
  const { data: pembayaranSummary, isLoading: loadingPembayaran } = usePembayaranSummary(
    { dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo },
    { enabled: !isInspector }
  );
  const { data: penjualanSummary, isLoading: loadingPenjualan } = usePenjualanSummary(
    { dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo },
    { enabled: !isInspector }
  );

  // Fetch recent data
  const { data: recentPembelians } = usePembelians({ page: 1, limit: 5 });
  const { data: recentPenjualans } = usePenjualans({ page: 1, limit: 5 });
  const { data: recentPembayarans } = usePembayarans({ page: 1, limit: 5 });
  const { data: recentPenjemurans } = usePenjemurans({ page: 1, limit: 5 });
  const { data: recentPengupasans } = usePengupasans({ page: 1, limit: 5 });
  const { data: recentPensortirans } = usePensortirans({ page: 1, limit: 5 });

  // Fetch hutang dan piutang untuk alert
  const { data: hutangData } = useHutangs({ page: 1, limit: 10 });
  const { data: piutangData } = usePiutangs({ page: 1, limit: 10 });

  // Fetch keuangan (transaksi masuk/keluar) berdasarkan period
  const { data: keuanganData } = useKeuangans({
    page: 1,
    limit: 10,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
  });

  // Absensi widget: total karyawan + sudah/belum absen hari ini
  const todayStr = dayjs().format("YYYY-MM-DD");
  const { data: karyawanData } = useKaryawans({ page: 1, limit: 1 });
  const { data: todayAbsensiData, isLoading: loadingTodayAbsensi } = useAbsensis({
    page: 1,
    limit: 1,
    tanggalFrom: todayStr,
    tanggalTo: todayStr,
  });
  const totalKaryawan = karyawanData?.pagination?.total ?? 0;
  const sudahAbsen = todayAbsensiData?.pagination?.total ?? 0;
  const belumAbsen = Math.max(0, totalKaryawan - sudahAbsen);
  const syncAbsensiManual = useSyncAbsensiManual();

  // Calculate saldo
  const saldo = React.useMemo(() => {
    if (!pembayaranSummary?.data) return 0;
    return pembayaranSummary.data.saldo || 0;
  }, [pembayaranSummary]);

  // Total keluar (keuangan tipe keluar) berdasarkan period
  const totalKeuanganKeluar = React.useMemo(() => {
    if (!keuanganData?.data) return 0;
    return keuanganData.data
      .filter((item: any) => item.arus === "KELUAR")
      .reduce((sum: number, item: any) => sum + Number(item.total || 0), 0);
  }, [keuanganData]);

  // Calculate active hutang dan piutang
  const activeHutang = React.useMemo(() => {
    if (!hutangData?.data) return 0;
    return hutangData.data.reduce((sum: number, item: any) => {
      const sisa = Number(item.total || 0) - Number(item.dibayar || 0);
      return sum + (sisa > 0 ? sisa : 0);
    }, 0);
  }, [hutangData]);

  const activePiutang = React.useMemo(() => {
    if (!piutangData?.data) return 0;
    return piutangData.data.reduce((sum: number, item: any) => {
      const sisa = Number(item.total || 0) - Number(item.dibayar || 0);
      return sum + (sisa > 0 ? sisa : 0);
    }, 0);
  }, [piutangData]);

  // Count produksi yang berjalan
  const produksiBerjalan = React.useMemo(() => {
    const penjemuran = recentPenjemurans?.data?.filter((p: any) => p.status === "BERJALAN").length || 0;
    const pengupasan = recentPengupasans?.data?.filter((p: any) => p.status === "BERJALAN").length || 0;
    const pensortiran = recentPensortirans?.data?.filter((p: any) => p.status === "BERJALAN").length || 0;
    return penjemuran + pengupasan + pensortiran;
  }, [recentPenjemurans, recentPengupasans, recentPensortirans]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {isInspector
              ? "Pembelian terbaru, aksi cepat, dan aktivitas produksi"
              : `Ringkasan aktivitas dan statistik ${dateRange.label.toLowerCase()}`}
          </p>
        </div>
        {!isInspector && (
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="week">Minggu Ini</SelectItem>
                <SelectItem value="month">Bulan Ini</SelectItem>
                <SelectItem value="year">Tahun Ini</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Statistik Cards - hanya OWNER */}
      {isOwner && (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Total Pembelian */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPembelian ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(pembelianSummary?.data?.totalValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pembelianSummary?.data?.totalPembelian || 0} transaksi
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Penjualan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPenjualan ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(penjualanSummary?.totalValue ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {penjualanSummary?.totalPenjualan ?? 0} transaksi
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Saldo Kas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Kas</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPembayaran ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(saldo)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pembayaranSummary?.data?.totalPembayaran || 0} transaksi
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pembayaran Masuk */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pembayaran Masuk</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loadingPembayaran ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(pembayaranSummary?.data?.totalMasuk || 0)}
                </div>
                <p className="text-xs text-muted-foreground">{dateRange.label}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pembayaran Keluar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pembayaran Keluar</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {loadingPembayaran ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(pembayaranSummary?.data?.totalKeluar || 0)}
                </div>
                <p className="text-xs text-muted-foreground">{dateRange.label}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      {/* Alert Cards - hanya OWNER */}
      {isOwner && (
      <div className="grid gap-4 md:grid-cols-3">
        {/* Hutang Aktif */}
        <Card className={activeHutang > 0 ? "border-orange-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hutang Aktif</CardTitle>
            <AlertCircle className={`h-4 w-4 ${activeHutang > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${activeHutang > 0 ? "text-orange-600" : ""}`}>
              {formatCurrency(activeHutang)}
            </div>
            <p className="text-xs text-muted-foreground">
              {hutangData?.data?.length || 0} hutang aktif
            </p>
          </CardContent>
        </Card>

        {/* Piutang Aktif */}
        <Card className={activePiutang > 0 ? "border-blue-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Piutang Aktif</CardTitle>
            <TrendingUp className={`h-4 w-4 ${activePiutang > 0 ? "text-blue-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${activePiutang > 0 ? "text-blue-600" : ""}`}>
              {formatCurrency(activePiutang)}
            </div>
            <p className="text-xs text-muted-foreground">
              {piutangData?.data?.length || 0} piutang aktif
            </p>
          </CardContent>
        </Card>

        {/* Produksi Berjalan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produksi Berjalan</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produksiBerjalan}</div>
            <p className="text-xs text-muted-foreground">Proses aktif</p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Widget Absensi Hari Ini - ringkasan + tombol sync manual */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Absensi Hari Ini</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncAbsensiManual.mutate()}
            disabled={syncAbsensiManual.isPending}
          >
            <RefreshCw className={`mr-2 size-4 ${syncAbsensiManual.isPending ? "animate-spin" : ""}`} />
            Sync manual
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => router.push("/karyawan")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Semua Karyawan</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingTodayAbsensi ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalKaryawan}</div>
                <p className="text-xs text-muted-foreground">Jumlah total karyawan</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => router.push("/absensi")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sudah Absen</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTodayAbsensi ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{sudahAbsen}</div>
                <p className="text-xs text-muted-foreground">Karyawan yang sudah absen hari ini</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => router.push("/absensi")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belum Absen</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTodayAbsensi ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-600">{belumAbsen}</div>
                <p className="text-xs text-muted-foreground">Karyawan yang belum absen hari ini</p>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pembelian Terbaru - semua role */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pembelian Terbaru</CardTitle>
                <CardDescription>5 pembelian terakhir</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/pembelian")}
              >
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Pemasok</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPembelians?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  recentPembelians?.data?.slice(0, 5).map((pembelian: any) => (
                    <TableRow
                      key={pembelian.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/pembelian/${pembelian.id}`)}
                    >
                      <TableCell className="font-medium">{pembelian.invoice}</TableCell>
                      <TableCell>{pembelian.pemasok?.nama || "Walk-in"}</TableCell>
                      <TableCell>{formatCurrency(Number(pembelian.total))}</TableCell>
                      <TableCell>
                        {dayjs(pembelian.createdAt).format("DD/MM/YYYY")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Penjualan - sembunyikan untuk Inspector, lebar sama dengan Pembelian */}
        {!isInspector && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Penjualan Terbaru</CardTitle>
                <CardDescription>5 penjualan terakhir</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/penjualan")}
              >
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPenjualans?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  recentPenjualans?.data?.slice(0, 5).map((penjualan: any) => (
                    <TableRow
                      key={penjualan.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/penjualan/${penjualan.id}`)}
                    >
                      <TableCell className="font-medium">{penjualan.invoice}</TableCell>
                      <TableCell>{formatCurrency(Number(penjualan.total))}</TableCell>
                      <TableCell>
                        {dayjs(penjualan.createdAt).format("DD/MM/YYYY")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}

        {/* Statistik Cepat - sembunyikan untuk Inspector; baris sendiri full width */}
        {!isInspector && (
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Statistik Cepat</CardTitle>
            <CardDescription>{dateRange.label}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Keuangan (Keluar)</span>
              </div>
              <span className="font-semibold text-red-600">
                {formatCurrency(totalKeuanganKeluar)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Penjualan</span>
              </div>
              <span className="font-semibold text-green-600">
                {formatCurrency(penjualanSummary?.totalValue ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pembelian</span>
              </div>
              <span className="font-semibold">
                {recentPembelians?.data?.filter((p: any) => {
                  const date = dayjs(p.createdAt);
                  const rangeStart = dayjs(dateRange.dateFrom);
                  const rangeEnd = dayjs(dateRange.dateTo);
                  return (date.isAfter(rangeStart, "day") || date.isSame(rangeStart, "day")) &&
                         (date.isBefore(rangeEnd, "day") || date.isSame(rangeEnd, "day"));
                }).length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Penjemuran</span>
              </div>
              <span className="font-semibold">
                {recentPenjemurans?.data?.filter((p: any) => {
                  const date = dayjs(p.tanggal_mulai);
                  const rangeStart = dayjs(dateRange.dateFrom);
                  const rangeEnd = dayjs(dateRange.dateTo);
                  return (date.isAfter(rangeStart, "day") || date.isSame(rangeStart, "day")) &&
                         (date.isBefore(rangeEnd, "day") || date.isSame(rangeEnd, "day"));
                }).length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pengupasan</span>
              </div>
              <span className="font-semibold">
                {recentPengupasans?.data?.filter((p: any) => {
                  const date = dayjs(p.tanggal_mulai);
                  const rangeStart = dayjs(dateRange.dateFrom);
                  const rangeEnd = dayjs(dateRange.dateTo);
                  return (date.isAfter(rangeStart, "day") || date.isSame(rangeStart, "day")) &&
                         (date.isBefore(rangeEnd, "day") || date.isSame(rangeEnd, "day"));
                }).length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pensortiran</span>
              </div>
              <span className="font-semibold">
                {recentPensortirans?.data?.filter((p: any) => {
                  const date = dayjs(p.tanggal_mulai);
                  const rangeStart = dayjs(dateRange.dateFrom);
                  const rangeEnd = dayjs(dateRange.dateTo);
                  return (date.isAfter(rangeStart, "day") || date.isSame(rangeStart, "day")) &&
                         (date.isBefore(rangeEnd, "day") || date.isSame(rangeEnd, "day"));
                }).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Recent Activities */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pembayaran Terbaru - sembunyikan untuk Inspector */}
        {!isInspector && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pembayaran Terbaru</CardTitle>
                <CardDescription>5 pembayaran terakhir</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/pembayaran")}
              >
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPembayarans?.data?.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">Tidak ada data</p>
              ) : (
                recentPembayarans?.data?.slice(0, 5).map((pembayaran: any) => (
                  <div
                    key={pembayaran.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    onClick={() => router.push(`/pembayaran`)}
                  >
                    <div className="flex items-center gap-3">
                      {pembayaran.arus === "MASUK" ? (
                        <ArrowDownCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{pembayaran.invoice}</p>
                        <p className="text-xs text-muted-foreground">
                          {pembayaran.sumberType} • {dayjs(pembayaran.createdAt).format("DD/MM/YYYY HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${pembayaran.arus === "MASUK" ? "text-green-600" : "text-red-600"}`}>
                        {pembayaran.arus === "MASUK" ? "+" : "-"}
                        {formatCurrency(Number(pembayaran.total))}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Aktivitas Produksi - semua role (termasuk Inspector) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Aktivitas Produksi</CardTitle>
                <CardDescription>Proses terbaru</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/penjemuran")}
              >
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Penjemuran */}
              {recentPenjemurans?.data?.slice(0, 2).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  onClick={() => router.push(`/penjemuran/${item.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Penjemuran</p>
                      <p className="text-xs text-muted-foreground">
                        {item.invoice || item.id} • {dayjs(item.tanggal_mulai).format("DD/MM/YYYY")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={item.status === "SELESAI" ? "default" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
              ))}

              {/* Pengupasan */}
              {recentPengupasans?.data?.slice(0, 2).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  onClick={() => router.push(`/pengupasan`)}
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Pengupasan</p>
                      <p className="text-xs text-muted-foreground">
                        {item.invoice || item.id} • {dayjs(item.tanggal_mulai).format("DD/MM/YYYY")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={item.status === "SELESAI" ? "default" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
              ))}

              {/* Pensortiran - sembunyikan untuk Inspector */}
              {!isInspector && recentPensortirans?.data?.slice(0, 1).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  onClick={() => router.push(`/pensortiran/${item.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">Pensortiran</p>
                      <p className="text-xs text-muted-foreground">
                        {item.invoice || item.id} • {dayjs(item.tanggal_mulai).format("DD/MM/YYYY")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={item.status === "SELESAI" ? "default" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
              ))}

              {(
                !recentPenjemurans?.data?.length &&
                !recentPengupasans?.data?.length &&
                (isInspector || !recentPensortirans?.data?.length)
              ) && (
                <p className="text-center text-sm text-muted-foreground">Tidak ada aktivitas</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aksi Cepat - Inspector hanya: Pembelian, Penjemuran, Pengupasan */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
          <CardDescription>
            {isInspector ? "Akses cepat ke pembelian dan produksi" : "Akses cepat ke fitur utama"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/pembelian/pos")}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Pembelian Baru
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/penjemuran")}
            >
              <Activity className="mr-2 h-4 w-4" />
              Penjemuran
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/pengupasan")}
            >
              <Package className="mr-2 h-4 w-4" />
              Pengupasan
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/absensi")}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Absensi
            </Button>
            {!isInspector && (
              <>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push("/penjualan/pos")}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Penjualan Baru
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push("/keuangan")}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Keuangan
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push("/laporan")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Laporan
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
