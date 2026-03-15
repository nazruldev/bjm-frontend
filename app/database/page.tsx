"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Download,
  Upload,
  RefreshCw,
  FileArchive,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useDatabaseBackups,
  useBackupDatabase,
  useRestoreDatabase,
  useOptimizeDatabase,
  useDownloadBackup,
  useResetData,
} from "@/hooks/useDatabase";
import { Skeleton } from "@/components/ui/skeleton";
// formatBytes sudah di-import dari utils, tidak perlu import lagi
import dayjs from "@/lib/dayjs";

export default function DatabasePage() {
  const { data: backups, isLoading: backupsLoading, refetch: refetchBackups } = useDatabaseBackups();
  const backupMutation = useBackupDatabase();
  const restoreMutation = useRestoreDatabase();
  const optimizeMutation = useOptimizeDatabase();
  const downloadMutation = useDownloadBackup();
  const resetMutation = useResetData();

  const [restoreDialogOpen, setRestoreDialogOpen] = React.useState(false);
  const [selectedBackup, setSelectedBackup] = React.useState<string | null>(null);
  const [optimizeDialogOpen, setOptimizeDialogOpen] = React.useState(false);
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);

  const handleBackup = () => {
    backupMutation.mutate(undefined, {
      onSuccess: () => {
        refetchBackups();
      },
    });
  };

  const handleRestoreClick = (filename: string) => {
    setSelectedBackup(filename);
    setRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = () => {
    if (selectedBackup) {
      restoreMutation.mutate(selectedBackup, {
        onSuccess: () => {
          setRestoreDialogOpen(false);
          setSelectedBackup(null);
        },
      });
    }
  };

  const handleOptimize = () => {
    optimizeMutation.mutate(undefined, {
      onSuccess: () => {
        setOptimizeDialogOpen(false);
      },
    });
  };

  const handleDownload = (filename: string) => {
    downloadMutation.mutate(filename);
  };

  const handleReset = () => {
    resetMutation.mutate(undefined, {
      onSuccess: () => {
        setResetDialogOpen(false);
      },
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Database</h1>
          <p className="text-muted-foreground mt-2">
            Backup, restore, dan optimasi database Anda
          </p>
        </div>
      </div>

      {/* Jumlah Backup */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Backup</CardTitle>
            <FileArchive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {backupsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{backups?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  File backup tersedia
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Database</CardTitle>
          <CardDescription>
            Lakukan backup, restore, atau optimasi database
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button
            onClick={handleBackup}
            disabled={backupMutation.isPending}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {backupMutation.isPending ? "Membuat Backup..." : "Buat Backup"}
          </Button>

          <Button
            onClick={() => setOptimizeDialogOpen(true)}
            disabled={optimizeMutation.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${optimizeMutation.isPending ? "animate-spin" : ""}`} />
            {optimizeMutation.isPending ? "Mengoptimalkan..." : "Optimasi Database"}
          </Button>

          <Button
            onClick={() => refetchBackups()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Daftar Backup
          </Button>

          <Button
            onClick={() => setResetDialogOpen(true)}
            disabled={resetMutation.isPending}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            {resetMutation.isPending ? "Mereset Data..." : "Reset Data"}
          </Button>
        </CardContent>
      </Card>

      {/* Daftar Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Backup</CardTitle>
          <CardDescription>
            File backup yang tersedia untuk restore atau download
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : backups && backups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama File</TableHead>
                  <TableHead>Ukuran</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.filename}>
                    <TableCell className="font-medium">{backup.filename}</TableCell>
                    <TableCell>{backup.sizeFormatted}</TableCell>
                    <TableCell>
                      {dayjs(backup.createdAt).format("DD MMM YYYY, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(backup.filename)}
                          disabled={downloadMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRestoreClick(backup.filename)}
                          disabled={restoreMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <Upload className="h-3 w-3" />
                          Restore
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada file backup
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Konfirmasi Restore Database
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin melakukan restore database dari file{" "}
              <strong>{selectedBackup}</strong>? Semua data saat ini akan diganti dengan data dari backup.
              <br />
              <br />
              <strong className="text-destructive">
                Tindakan ini tidak dapat dibatalkan!
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Restore Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Optimize Dialog */}
      <AlertDialog open={optimizeDialogOpen} onOpenChange={setOptimizeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Konfirmasi Optimasi Database
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengoptimalkan database? Proses ini akan menjalankan VACUUM ANALYZE
              untuk meningkatkan performa database.
              <br />
              <br />
              Proses ini mungkin memakan waktu beberapa menit tergantung ukuran database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleOptimize}>
              Ya, Optimasi Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Data Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Konfirmasi Reset Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-destructive text-lg block mb-2">
                PERINGATAN: Tindakan ini tidak dapat dibatalkan!
              </strong>
              Apakah Anda yakin ingin melakukan reset data? Semua transaksi akan dihapus, termasuk:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Hutang dan Piutang</li>
                <li>Penjemuran, Pengupasan, dan Pensortiran</li>
                <li>Keuangan dan Pembayaran</li>
                <li>Pembelian</li>
                <li>Penggajian</li>
                <li>Absensi</li>
                <li>Mutasi Stok</li>
              </ul>
              <br />
              <strong>Data yang TIDAK akan dihapus:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Pengguna (User accounts)</li>
                <li>Outlet</li>
                <li>Karyawan, Pekerja, Pemasok (Master data)</li>
                <li>Rekening dan Gaji (Master data)</li>
                <li>Produk (Master data)</li>
              </ul>
              <br />
              <strong className="text-destructive">
                Sebaiknya buat backup terlebih dahulu sebelum melakukan reset!
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Reset Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
