import axios from "@/lib/axios";

export interface BackupInfo {
  filename: string;
  filepath: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
}

export interface RestoreRequest {
  filename: string;
}

class DatabaseService {
  async backup(): Promise<BackupInfo> {
    const response = await axios.post<{ message: string; data: BackupInfo }>("/database/backup");
    return response.data.data;
  }

  async restore(data: RestoreRequest): Promise<{ message: string; data: { filename: string; restoredAt: string } }> {
    const response = await axios.post("/database/restore", data);
    return response.data;
  }

  async optimize(): Promise<{ message: string; data: { optimizedAt: string } }> {
    const response = await axios.post("/database/optimize");
    return response.data;
  }

  async listBackups(): Promise<Array<{ filename: string; size: number; sizeFormatted: string; createdAt: Date }>> {
    const response = await axios.get<{ message: string; data: Array<{ filename: string; size: number; sizeFormatted: string; createdAt: Date }> }>("/database/backups");
    return response.data.data;
  }

  async downloadBackup(filename: string): Promise<Blob> {
    const response = await axios.get(`/database/backups/${filename}`, {
      responseType: "blob",
    });
    return response.data;
  }

  async resetData(): Promise<{ message: string; data: { resetAt: string } }> {
    const response = await axios.post("/database/reset");
    return response.data;
  }
}

export const databaseService = new DatabaseService();
