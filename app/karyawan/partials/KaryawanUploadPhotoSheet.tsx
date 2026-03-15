"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { karyawanService, type Karyawan } from "@/services/karyawanService";
import { deviceAcsService, type DeviceAcsItem } from "@/services/deviceAcsService";
import { useQueryClient } from "@tanstack/react-query";
import { karyawanKeys } from "@/hooks/useKaryawans";
import Hls from "hls.js";
import { Camera, Video } from "lucide-react";

interface KaryawanUploadPhotoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  karyawan: Karyawan | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      resolve(base64 ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** URL untuk tampil foto: headPicUrl (http/data) atau data URL dari faceBase64 */
function getCurrentPhotoUrl(k: Karyawan | null): string | null {
  if (!k) return null;
  if (k.headPicUrl?.startsWith("http") || k.headPicUrl?.startsWith("data:"))
    return k.headPicUrl;
  if (k.faceBase64?.trim())
    return `data:image/jpeg;base64,${k.faceBase64.trim()}`;
  return null;
}

const deviceSerial = (d: DeviceAcsItem) => (d.serialNo ?? d.deviceId ?? d.code ?? "").toString();
const deviceName = (d: DeviceAcsItem) => d.name ?? d.id ?? d.deviceId ?? d.code ?? "—";

export function KaryawanUploadPhotoSheet({
  open,
  onOpenChange,
  karyawan,
}: KaryawanUploadPhotoSheetProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  // Capture dari device
  const [captureOpen, setCaptureOpen] = React.useState(false);
  const [devices, setDevices] = React.useState<DeviceAcsItem[]>([]);
  const [devicesLoading, setDevicesLoading] = React.useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>("");
  const [streamUrl, setStreamUrl] = React.useState<string | null>(null);
  const [streamStep, setStreamStep] = React.useState<"idle" | "token" | "token_ok" | "url" | "url_ok" | "error">("idle");
  const [streamError, setStreamError] = React.useState<string | null>(null);
  const [streamVideoReady, setStreamVideoReady] = React.useState(false);
  const captureVideoRef = React.useRef<HTMLVideoElement>(null);
  const streamCacheRef = React.useRef<{ serial: string; url: string; expireTime: string } | null>(null);

  const isStreamUrlValid = React.useCallback((expireTime: string | null | undefined) => {
    if (!expireTime) return false;
    const exp = new Date(expireTime).getTime();
    if (Number.isNaN(exp)) return false;
    return Date.now() < exp - 30 * 1000;
  }, []);

  const selectedDevice = React.useMemo(
    () => devices.find((d) => (d.id ?? d.deviceId ?? d.code) === selectedDeviceId) ?? null,
    [devices, selectedDeviceId]
  );

  React.useEffect(() => {
    if (!captureOpen) return;
    setDevicesLoading(true);
    deviceAcsService
      .getDevices({ pageIndex: 1, pageSize: 100 })
      .then((res) => {
        if (res.success && Array.isArray(res.devices)) setDevices(res.devices);
        else setDevices([]);
      })
      .catch(() => setDevices([]))
      .finally(() => setDevicesLoading(false));
  }, [captureOpen]);

  const startStream = React.useCallback(async () => {
    const device = selectedDevice;
    if (!device) {
      toast.error("Pilih device terlebih dahulu.");
      return;
    }
    const serial = deviceSerial(device);
    if (!serial) {
      toast.error("Device tidak memiliki serial.");
      return;
    }
    setStreamError(null);

    const cached = streamCacheRef.current;
    if (cached?.serial === serial && isStreamUrlValid(cached.expireTime)) {
      setStreamStep("url_ok");
      setStreamUrl(cached.url);
      return;
    }

    setStreamStep("token");
    setStreamUrl(null);
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
        setStreamError(urlRes.message ?? "Gagal mengambil URL live");
        setStreamStep("error");
        return;
      }
      const expireTime = urlRes.data.expireTime ?? "";
      streamCacheRef.current = { serial, url: urlRes.data.url, expireTime };
      setStreamStep("url_ok");
      setStreamUrl(urlRes.data.url);
    } catch (e: any) {
      setStreamError(e?.response?.data?.message ?? e?.message ?? "Gagal stream");
      setStreamStep("error");
    }
  }, [selectedDevice, isStreamUrlValid]);

  React.useEffect(() => {
    if (!streamUrl || !captureVideoRef.current) return;
    setStreamVideoReady(false);
    const video = captureVideoRef.current;
    const onReady = () => setStreamVideoReady(true);
    const play = () => video.play().catch(() => {});
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 45,
        maxMaxBufferLength: 60,
        startLevel: 0,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => play());
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
        }
      });
      video.addEventListener("loadeddata", play);
      video.addEventListener("canplay", onReady);
      video.addEventListener("playing", onReady);
      video.addEventListener("waiting", () => play());
      video.addEventListener("stalled", () => play());
      return () => {
        video.removeEventListener("loadeddata", play);
        video.removeEventListener("canplay", onReady);
        video.removeEventListener("playing", onReady);
        video.removeEventListener("waiting", play);
        video.removeEventListener("stalled", play);
        hls.destroy();
      };
    }
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.addEventListener("loadeddata", play);
      video.addEventListener("canplay", onReady);
      video.addEventListener("playing", onReady);
      video.addEventListener("waiting", () => play());
      video.addEventListener("stalled", () => play());
      return () => {
        video.removeEventListener("loadeddata", play);
        video.removeEventListener("canplay", onReady);
        video.removeEventListener("playing", onReady);
        video.removeEventListener("waiting", play);
        video.removeEventListener("stalled", play);
        video.src = "";
      };
    }
  }, [streamUrl]);

  const handleCapture = React.useCallback(() => {
    const video = captureVideoRef.current;
    if (!video || video.readyState < 3) {
      toast.error("Tunggu video siap.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const f = new File([blob], "capture.jpg", { type: "image/jpeg" });
        setFile(f);
        setPreview((prev) => {
          if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
          return URL.createObjectURL(f);
        });
        setCaptureOpen(false);
        toast.success("Capture dipakai sebagai foto. Lanjutkan dengan Upload.");
      },
      "image/jpeg",
      0.92
    );
  }, []);

  const closeCaptureDialog = React.useCallback(() => {
    setCaptureOpen(false);
    setSelectedDeviceId("");
    setStreamUrl(null);
    setStreamVideoReady(false);
    setStreamStep("idle");
    setStreamError(null);
  }, []);

  // Saat sheet dibuka: tampilkan foto yang sudah ada; kalau user pilih file baru, ganti preview
  const defaultPhotoUrl = React.useMemo(
    () => (open ? getCurrentPhotoUrl(karyawan) : null),
    [open, karyawan?.id, karyawan?.headPicUrl, karyawan?.faceBase64]
  );

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview((prev) => {
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    // Set preview ke foto yang sudah ada (default)
    if (!file) setPreview(defaultPhotoUrl ?? null);
  }, [open, defaultPhotoUrl, file]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Pilih file gambar (JPG, PNG, dll).");
      return;
    }
    setFile(f);
    setPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const handleSubmit = async () => {
    if (!karyawan?.id || !file) {
      toast.error("Pilih foto terlebih dahulu.");
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      await karyawanService.uploadKaryawanPhoto(karyawan.id, base64);
      toast.success("Foto berhasil diupload.");
      queryClient.invalidateQueries({ queryKey: karyawanKeys.lists() });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal upload foto.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Upload foto — {karyawan?.nama ?? ""}</SheetTitle>
          <p className="text-muted-foreground text-sm">
            {defaultPhotoUrl
              ? "Foto saat ini. Klik pilih file untuk mengganti, lalu Upload."
              : "Belum ada foto. Pilih foto untuk disimpan ke Hik dan ditampilkan."}
          </p>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-5">
          {(preview ?? defaultPhotoUrl) && (
            <div className="flex justify-center">
              <img
                src={preview ?? defaultPhotoUrl ?? ""}
                alt="Preview"
                className="h-40 w-40 rounded-lg border object-cover"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="photo">{file ? "File baru dipilih" : "Pilih foto"}</Label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
              onChange={onFileChange}
            />
          </div>
          <div className="border-t pt-4 space-y-2">
            <p className="text-muted-foreground text-sm">Atau ambil dari kamera device:</p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setCaptureOpen(true)}
              disabled={uploading}
            >
              <Camera className="size-4 mr-2" />
              Ambil dari device
            </Button>
          </div>
        </div>
        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>
            {uploading ? "Mengupload..." : file ? "Upload & ganti foto" : "Upload"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <Dialog open={captureOpen} onOpenChange={(o) => !o && closeCaptureDialog()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="size-5" />
            Ambil capture dari device
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <p className="text-muted-foreground text-sm">
            Atur posisi wajah di dalam lingkaran, lalu klik Ambil capture. Stream mengikuti masa berlaku dari device (expire).
          </p>

          {!streamUrl ? (
            <>
              <div className="space-y-2">
                <Label>Pilih device</Label>
                <Select
                  value={selectedDeviceId}
                  onValueChange={(v) => {
                    setSelectedDeviceId(v);
                    setStreamError(null);
                  }}
                  disabled={devicesLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={devicesLoading ? "Memuat..." : "Pilih device"} />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((d) => {
                      const id = (d.id ?? d.deviceId ?? d.code) as string;
                      if (!id) return null;
                      return (
                        <SelectItem key={id} value={id}>
                          {deviceName(d)} {d.serialNo ? `(${d.serialNo})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {streamStep === "token" && <p className="text-sm text-muted-foreground">⏳ Mengambil stream token…</p>}
              {streamStep === "url" && <p className="text-sm text-muted-foreground">⏳ Mendapatkan URL live…</p>}
              {streamError && <p className="text-sm text-destructive">{streamError}</p>}
              <Button onClick={startStream} disabled={!selectedDeviceId || streamStep === "token" || streamStep === "url"}>
                Tampilkan kamera
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-lg overflow-hidden bg-black aspect-video w-full relative">
                <video
                  ref={captureVideoRef}
                  className="w-full h-full object-contain scale-x-[-1]"
                  muted
                  playsInline
                />
                {!streamVideoReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm">
                    <span className="animate-pulse">Memuat video…</span>
                  </div>
                )}
                {/* Masking: lingkaran panduan posisi kepala */}
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-center"
                  aria-hidden
                >
                  <svg
                    viewBox="0 0 120 120"
                    className="w-[70%] max-w-[280px] h-auto text-[#9ca3af]"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      opacity="0.85"
                    />
                  </svg>
                </div>
              </div>
              <Button
                onClick={handleCapture}
                className="w-full"
                disabled={!streamVideoReady}
              >
                <Camera className="size-4 mr-2" />
                {streamVideoReady ? "Ambil capture" : "Tunggu video siap…"}
              </Button>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeCaptureDialog}>
            Batal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
