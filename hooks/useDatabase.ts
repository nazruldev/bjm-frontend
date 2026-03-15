import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { databaseService, type BackupInfo } from "@/services/databaseService";
import { toast } from "sonner";

const databaseKeys = {
  all: ["database"] as const,
  backups: () => [...databaseKeys.all, "backups"] as const,
};

/**
 * Hook untuk mendapatkan daftar backup
 */
export function useDatabaseBackups() {
  return useQuery({
    queryKey: databaseKeys.backups(),
    queryFn: () => databaseService.listBackups(),
    staleTime: 1 * 60 * 1000, // 1 menit
    gcTime: 5 * 60 * 1000, // 5 menit
  });
}

/**
 * Hook untuk backup database
 */
export function useBackupDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => databaseService.backup(),
    onSuccess: (data) => {
      toast.success(`Backup berhasil dibuat: ${data.filename} (${data.sizeFormatted})`);
      queryClient.invalidateQueries({ queryKey: databaseKeys.backups() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || error?.message || "Gagal membuat backup";
      toast.error(message);
    },
  });
}

/**
 * Hook untuk restore database
 */
export function useRestoreDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filename: string) => databaseService.restore({ filename }),
    onSuccess: () => {
      toast.success("Database berhasil di-restore");
      // Reload page setelah restore untuk memastikan data terbaru
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || error?.message || "Gagal restore database";
      toast.error(message);
    },
  });
}

/**
 * Hook untuk optimize database
 */
export function useOptimizeDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => databaseService.optimize(),
    onSuccess: () => {
      toast.success("Database berhasil dioptimalkan");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || error?.message || "Gagal mengoptimalkan database";
      toast.error(message);
    },
  });
}

/**
 * Hook untuk download backup
 */
export function useDownloadBackup() {
  return useMutation({
    mutationFn: (filename: string) => databaseService.downloadBackup(filename),
    onSuccess: (blob, filename) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Backup berhasil diunduh");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || error?.message || "Gagal mengunduh backup";
      toast.error(message);
    },
  });
}

/**
 * Hook untuk reset data
 */
export function useResetData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => databaseService.resetData(),
    onSuccess: () => {
      toast.success("Data berhasil di-reset. Semua transaksi telah dihapus kecuali Pengguna dan Outlet.");
      // Invalidate semua queries untuk refresh data
      queryClient.invalidateQueries();
      // Reload page setelah reset untuk memastikan data terbaru
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || error?.message || "Gagal reset data";
      toast.error(message);
    },
  });
}
