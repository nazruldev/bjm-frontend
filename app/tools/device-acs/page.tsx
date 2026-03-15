"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deviceAcsService, type DeviceAcsItem } from "@/services/deviceAcsService";
import { RefreshCw, Cpu, Eye, Video } from "lucide-react";
import Hls from "hls.js";

export default function DeviceACSPage() {
  const [devices, setDevices] = React.useState<DeviceAcsItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailDevice, setDetailDevice] = React.useState<DeviceAcsItem | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailData, setDetailData] = React.useState<DeviceAcsItem | null>(null);

  const [streamOpen, setStreamOpen] = React.useState(false);
  const [streamDevice, setStreamDevice] = React.useState<DeviceAcsItem | null>(null);
  const [streamUrl, setStreamUrl] = React.useState<string | null>(null);
  const [streamExpireTime, setStreamExpireTime] = React.useState<string | null>(null);
  const [streamStep, setStreamStep] = React.useState<"idle" | "token" | "token_ok" | "url" | "url_ok" | "error">("idle");
  const [streamError, setStreamError] = React.useState<string | null>(null);
  const streamVideoRef = React.useRef<HTMLVideoElement>(null);
  /** Cache stream URL per device; jangan request lagi kalau belum expired */
  const streamCacheRef = React.useRef<{ serial: string; url: string; expireTime: string } | null>(null);

  const isStreamUrlValid = React.useCallback((expireTime: string | null | undefined) => {
    if (!expireTime) return false;
    const exp = new Date(expireTime).getTime();
    if (Number.isNaN(exp)) return false;
    return Date.now() < exp - 30 * 1000; // 30s buffer sebelum expiry
  }, []);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await deviceAcsService.getDevices({ pageIndex: 1, pageSize: 100 });
      if (!res.success) {
        toast.error(res.message ?? "Gagal memuat device.");
        setDevices([]);
        return;
      }
      setDevices(Array.isArray(res.devices) ? res.devices : []);
      if (res.created != null && res.created > 0) {
        toast.success(`${res.created} device baru disinkronkan.`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? e?.message ?? "Gagal memuat device.");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openDetail = async (device: DeviceAcsItem) => {
    const id = (device.id ?? device.deviceId ?? device.code) as string;
    if (!id) return;
    setDetailDevice(device);
    setDetailOpen(true);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const res = await deviceAcsService.getDeviceDetail([id], device.serialNo as string | undefined);
      if (res.success && Array.isArray(res.devices) && res.devices.length > 0) {
        setDetailData(res.devices[0]);
      } else {
        setDetailData(device);
      }
    } catch {
      setDetailData(device);
    } finally {
      setDetailLoading(false);
    }
  };

  const deviceId = (d: DeviceAcsItem) => d.id ?? d.deviceId ?? d.code ?? "—";
  const deviceSerial = (d: DeviceAcsItem) => (d.serialNo ?? d.deviceId ?? d.code ?? "").toString();
  const deviceName = (d: DeviceAcsItem) => d.name ?? deviceId(d);
  const onlineLabel = (d: DeviceAcsItem) =>
    d.onlineStatus === 1 ? "Online" : d.onlineStatus === 0 ? "Offline" : "—";

  const openStream = React.useCallback(async (device: DeviceAcsItem) => {
    const serial = deviceSerial(device);
    if (!serial) {
      toast.error("Device tidak memiliki serial / ID");
      return;
    }
    setStreamDevice(device);
    setStreamOpen(true);

    const cached = streamCacheRef.current;
    if (cached?.serial === serial && isStreamUrlValid(cached.expireTime)) {
      setStreamUrl(cached.url);
      setStreamExpireTime(cached.expireTime || null);
      setStreamStep("url_ok");
      setStreamError(null);
      return;
    }

    setStreamUrl(null);
    setStreamExpireTime(null);
    setStreamError(null);
    setStreamStep("token");

    try {
      const tokenRes = await deviceAcsService.getStreamToken();
      if (!tokenRes.success || !tokenRes.data?.appToken) {
        setStreamError(tokenRes.message ?? "Gagal mengambil stream token");
        setStreamStep("error");
        return;
      }
      setStreamStep("token_ok");

      setStreamStep("url");
      const urlRes = await deviceAcsService.getLiveStreamUrl(serial, {
        appToken: tokenRes.data.appToken,
        streamAreaDomain: tokenRes.data.streamAreaDomain,
      });
      if (!urlRes.success || !urlRes.data?.url) {
        setStreamError(urlRes.message ?? "Gagal mengambil URL live stream");
        setStreamStep("error");
        return;
      }
      const expireTime = urlRes.data.expireTime ?? "";
      streamCacheRef.current = { serial, url: urlRes.data.url, expireTime };
      setStreamExpireTime(expireTime || null);
      setStreamStep("url_ok");
      setStreamUrl(urlRes.data.url);
    } catch (e: any) {
      setStreamError(e?.response?.data?.message ?? e?.message ?? "Gagal mengambil stream");
      setStreamStep("error");
    }
  }, [isStreamUrlValid]);

  // Attach HLS to video when streamUrl is set; autoplay when loaded
  React.useEffect(() => {
    if (!streamUrl || !streamVideoRef.current) return;
    const video = streamVideoRef.current;
    const play = () => {
      video.play().catch(() => {});
    };
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, play);
      video.addEventListener("loadeddata", play);
      return () => {
        video.removeEventListener("loadeddata", play);
        hls.destroy();
      };
    }
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.addEventListener("loadeddata", play);
      return () => {
        video.removeEventListener("loadeddata", play);
        video.src = "";
      };
    }
  }, [streamUrl]);

  return (
    <>
      <div className="p-4 md:p-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="size-5" />
                Device ACS
              </CardTitle>
              <CardDescription>
                Daftar device dari HikConnect. Hanya get dan detail (read-only).
              </CardDescription>
            </div>
            <Button onClick={fetchList} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Memuat..." : "Muat ulang"}
            </Button>
          </CardHeader>
          <CardContent>
            {loading && devices.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8">Memuat daftar device...</p>
            ) : devices.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8">Tidak ada device atau HikConnect belum dikonfigurasi.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>ID / Kode</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((d, i) => (
                    <TableRow key={deviceId(d) ?? i}>
                      <TableCell className="font-medium">{deviceName(d)}</TableCell>
                      <TableCell className="font-mono text-xs">{String(deviceId(d))}</TableCell>
                      <TableCell>{d.category ?? "—"}</TableCell>
                      <TableCell>{d.type ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{d.serialNo ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={d.onlineStatus === 1 ? "default" : "secondary"}>
                          {onlineLabel(d)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openStream(d)}
                            className="gap-1"
                            title="Live streaming"
                          >
                            <Video className="size-4" />
                            Live
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(d)}
                            className="gap-1"
                          >
                            <Eye className="size-4" />
                            Detail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detail device — {detailDevice ? deviceName(detailDevice) : ""}</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            {detailLoading ? (
              <p className="text-muted-foreground text-sm">Memuat detail...</p>
            ) : detailData ? (
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">ID / deviceId / code</dt>
                  <dd className="font-mono">{deviceId(detailData)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Nama</dt>
                  <dd>{detailData.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Kategori</dt>
                  <dd>{detailData.category ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tipe</dt>
                  <dd>{detailData.type ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Serial No</dt>
                  <dd className="font-mono">{detailData.serialNo ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Version</dt>
                  <dd>{detailData.version ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Time zone</dt>
                  <dd>{detailData.timeZone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant={detailData.onlineStatus === 1 ? "default" : "secondary"}>
                      {onlineLabel(detailData)}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Area ID</dt>
                  <dd>{detailData.areaId ?? "—"}</dd>
                </div>
                {Array.isArray(detailData.accessLevelList) && detailData.accessLevelList.length > 0 && (
                  <div>
                    <dt className="text-muted-foreground">Access level</dt>
                    <dd className="mt-1">
                      <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-32">
                        {JSON.stringify(detailData.accessLevelList, null, 2)}
                      </pre>
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">Tidak ada data detail.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Live stream dialog */}
      <Dialog open={streamOpen} onOpenChange={setStreamOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="size-5" />
              Live — {streamDevice ? deviceName(streamDevice) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            {streamStep !== "idle" && !streamUrl && !streamError && (
              <ul className="text-muted-foreground text-sm space-y-1">
                <li className={streamStep === "token" ? "font-medium text-foreground" : ""}>
                  {(streamStep === "token_ok" || streamStep === "url") && "✓ "}
                  {streamStep === "token" && "⏳ "}
                  Mengambil stream token (GET streamtoken/get)
                  {(streamStep === "token_ok" || streamStep === "url") && " — Berhasil"}
                </li>
                <li className={streamStep === "url" ? "font-medium text-foreground" : ""}>
                  {streamStep === "url" && "⏳ "}
                  Mendapatkan URL live (POST live/address/get)
                </li>
              </ul>
            )}
            {streamError && (
              <p className="text-destructive text-sm">{streamError}</p>
            )}
            {streamUrl && !streamError && (
              <>
                {streamExpireTime && (
                  <p className="text-muted-foreground text-xs">
                    URL berlaku sampai {streamExpireTime}
                  </p>
                )}
                <div className="scale-x-100 rounded-lg overflow-hidden bg-black aspect-video w-full">
                  <video
                  ref={streamVideoRef}
                  className="w-full h-full object-contain scale-x-[-1]"
                  controls={false}
                  autoPlay
                  muted
                  playsInline
                  onLoadedData={(e) => e.currentTarget.play().catch(() => {})}
                />
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
