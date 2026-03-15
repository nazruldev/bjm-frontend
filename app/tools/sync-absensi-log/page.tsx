"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSyncAbsensiLogs, useSyncAbsensiManual } from "@/hooks/useSyncAbsensiLogs";
import { ClipboardCheck, RefreshCw } from "lucide-react";
import dayjs from "dayjs";


const PAGE_SIZE = 20;

export default function SyncAbsensiLogPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, refetch } = useSyncAbsensiLogs({ page, limit: PAGE_SIZE });
  const syncManual = useSyncAbsensiManual();

  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="size-5" />
              Sync Absensi Log
            </CardTitle>
            <CardDescription>
              Riwayat eksekusi sync absensi dari device Hik ke data absensi.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => syncManual.mutate()}
              disabled={syncManual.isPending}
            >
              <RefreshCw className={`mr-2 size-4 ${syncManual.isPending ? "animate-spin" : ""}`} />
              Sync manual
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Memuat..." : "Muat ulang"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && logs.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8">Memuat log...</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8">Belum ada riwayat sync.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mulai</TableHead>
                    <TableHead>Selesai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Device</TableHead>
                    <TableHead className="text-right">Event</TableHead>
                    <TableHead className="text-right">Buat</TableHead>
                    <TableHead className="text-right">Update</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                        {dayjs(log.startedAt).format("DD/MM/YY HH:mm:ss")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                        {log.finishedAt
                          ? dayjs(log.finishedAt).format("DD/MM/YY HH:mm:ss")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.success ? "default" : "destructive"}>
                          {log.success ? "Sukses" : "Gagal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {log.devicesProcessed ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {log.eventsCount ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {log.createdCount ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {log.updatedCount ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-destructive text-sm">
                        {log.errorMessage ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-muted-foreground text-sm">
                    Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} log)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1 || isLoading}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={pagination.page >= pagination.totalPages || isLoading}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
