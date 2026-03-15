import { useMutation } from "@tanstack/react-query";
import { databaseService } from "@/services/databaseService";
import { toast } from "sonner";

/**
 * Hook untuk backup database (POST buat file lalu download)
 */
export function useBackupDatabase() {
  return useMutation({
    mutationFn: async () => {
      const data = await databaseService.backup();
      const blob = await databaseService.downloadBackup(data.filename);
      return { blob, filename: data.filename };
    },
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Backup database berhasil didownload");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        "Gagal melakukan backup database";
      toast.error(message);
    },
  });
}

