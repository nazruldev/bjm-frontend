"use client";

import * as React from "react";
import { useBackupDatabase } from "@/hooks/useSettings";
import { useSystemConfig, useUpdateSystemConfig, useTestKirimi, useTestHik } from "@/hooks/useSystemConfig";
import { SYSTEM_CONFIG_KEYS } from "@/services/systemConfigService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Database, Download, MessageCircle, Shield } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";

const LABELS: Record<string, string> = {
  KIRIMI_USER_CODE: "User Code",
  KIRIMI_DEVICE_ID: "Device ID",
  KIRIMI_SECRET_KEY: "Secret Key",
  KIRIMI_ENABLED: "Kirim WhatsApp (Kirimi)",
  HIK_BASE_URL: "Base URL",
  HIK_APP_KEY: "App Key",
  HIK_SECRET_KEY: "Secret Key",
  HIK_TOKEN: "Token",
};
const IS_SECRET = (k: string) => k.includes("SECRET") || k === "HIK_TOKEN";

export default function SettingPage() {
  const { user } = useAuth();
  const backupDatabase = useBackupDatabase();
  const isOwner = user?.role === "OWNER";
  const { data: configData, isLoading: configLoading } = useSystemConfig(isOwner);
  const updateConfig = useUpdateSystemConfig();
  const testKirimi = useTestKirimi();
  const testHik = useTestHik();
  const [integrasi, setIntegrasi] = React.useState<Record<string, string>>({});
  const [testReceiver, setTestReceiver] = React.useState("");

  React.useEffect(() => {
    if (configData && typeof configData === "object") {
      const next: Record<string, string> = {};
      for (const k of SYSTEM_CONFIG_KEYS) next[k] = configData[k] ?? "";
      setIntegrasi(next);
    }
  }, [configData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="size-8" />
          Pengaturan
        </h1>
        <p className="text-muted-foreground mt-2">
          Kelola backup database dan integrasi (Kirimi & Hik)
        </p>
      </div>

      {/* Backup Database Card - hanya OWNER */}
      {isOwner && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Backup Database
          </CardTitle>
          <CardDescription>
            Unduh backup database dalam format SQL untuk keamanan data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Backup database akan menghasilkan file SQL yang berisi semua data dan struktur database. 
              File ini dapat digunakan untuk restore database di kemudian hari.
            </p>
            <Button
              onClick={() => backupDatabase.mutate()}
              disabled={backupDatabase.isPending}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {backupDatabase.isPending ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Membuat Backup...
                </>
              ) : (
                <>
                  <Download className="mr-2 size-4" />
                  Download Backup Database
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Integrasi Kirimi & Hik - hanya OWNER */}
      {isOwner && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="size-5" />
            Integrasi (Kirimi & Hik)
          </CardTitle>
          <CardDescription>
            Konfigurasi dari database (override .env). Isi lalu simpan. Gunakan Test untuk cek koneksi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {configLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="size-4" /> Kirimi (WhatsApp)
                  </h4>
                  {SYSTEM_CONFIG_KEYS.filter((k) => k.startsWith("KIRIMI")).map((key) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{LABELS[key] ?? key}</Label>
                      {key === "KIRIMI_ENABLED" ? (
                        <select
                          id={key}
                          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={
                            (integrasi[key]?.trim().toLowerCase() === "1" ||
                            integrasi[key]?.trim().toLowerCase() === "true" ||
                            integrasi[key]?.trim().toLowerCase() === "yes" ||
                            integrasi[key]?.trim().toLowerCase() === "on")
                              ? "on"
                              : "off"
                          }
                          onChange={(e) =>
                            setIntegrasi((prev) => ({
                              ...prev,
                              [key]: e.target.value === "on" ? "1" : "0",
                            }))
                          }
                        >
                          <option value="off">Nonaktif (default)</option>
                          <option value="on">Aktifkan kirim WA</option>
                        </select>
                      ) : (
                        <Input
                          id={key}
                          type={IS_SECRET(key) ? "password" : "text"}
                          placeholder={key}
                          value={integrasi[key] ?? ""}
                          onChange={(e) =>
                            setIntegrasi((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          autoComplete="off"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Shield className="size-4" /> HikConnect
                  </h4>
                  {SYSTEM_CONFIG_KEYS.filter((k) => k.startsWith("HIK")).map((key) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{LABELS[key] ?? key}</Label>
                      <Input
                        id={key}
                        type={IS_SECRET(key) ? "password" : "text"}
                        placeholder={key}
                        value={integrasi[key] ?? ""}
                        onChange={(e) =>
                          setIntegrasi((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        autoComplete="off"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-4 pt-2">
                <Button
                  type="button"
                  onClick={() => updateConfig.mutate(integrasi)}
                  disabled={updateConfig.isPending}
                >
                  {updateConfig.isPending ? (
                    <>
                      <Spinner className="mr-2 size-4" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Konfigurasi"
                  )}
                </Button>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="62xxx untuk test Kirimi"
                    value={testReceiver}
                    onChange={(e) => setTestReceiver(e.target.value)}
                    className="w-44"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => testKirimi.mutate(testReceiver.trim())}
                    disabled={testKirimi.isPending || !testReceiver.trim()}
                  >
                    {testKirimi.isPending ? (
                      <Spinner className="size-4" />
                    ) : (
                      "Test Kirimi"
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => testHik.mutate()}
                  disabled={testHik.isPending}
                >
                  {testHik.isPending ? (
                    <Spinner className="mr-2 size-4" />
                  ) : null}
                  Test Hik
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}

