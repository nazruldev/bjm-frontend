"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTables } from "@/components/datatables/table";
import { useKaryawans, useGenerateSelfServiceLink, useAktifkanBiometric, useSendMandiriLinkWa, usePindahOutlet } from "@/hooks/useKaryawans";
import { useGajis } from "@/hooks/useGajis";
import { useOutlets } from "@/hooks/useOutlets";
import { useTableState } from "@/hooks/useTableState";
import { useTableQuery } from "@/hooks/useTableQuery";
import {
  type CreateKaryawanDto,
  type Karyawan,
  type GetKaryawansParams,
  karyawanService,
} from "@/services/karyawanService";
import { karyawanKeys } from "@/hooks/useKaryawans";
import { useQueryClient } from "@tanstack/react-query";
import { createFormConfig } from "./validations/createValidation";
import { createKaryawanColumns } from "./partials/columns";
import { createKaryawanFilterConfigs } from "./partials/filters";
import { KaryawanUploadPhotoSheet } from "./partials/KaryawanUploadPhotoSheet";
import { KaryawanAccessLevelSheet } from "./partials/KaryawanAccessLevelSheet";
import { KaryawanPinSheet } from "./partials/KaryawanPinSheet";
import { KaryawanDetailSheet } from "./partials/KaryawanDetailSheet";
import { GajiSelectWithAdd } from "./partials/GajiSelectWithAdd";
import { DeleteDialog } from "@/components/delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKaryawanHandlers } from "./partials/handlers";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Copy, Fingerprint, Loader2, MessageCircle, Building2, CheckCircle, KeyRound, AlertCircle, FileDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/** Format digit-only ke tampilan nomor Indonesia: 08xx-xxxx-xxxx */
function formatPhoneId(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 12);
  if (d.length <= 4) return d;
  if (d.length <= 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
}

/** Normalisasi nomor untuk wa.me: 62xxxxxxxxxx (tanpa 0 depan) */
function phoneToWa(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return "62" + d.slice(1);
  if (d.length >= 9 && d.length <= 11) return "62" + d;
  return "62" + d;
}

function KaryawanContent() {
  const { user } = useAuth();
  const canManageAccessLevel = user?.role === "OWNER";
  // Table state dengan URL sync
  const {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  } = useTableState({ defaultPageSize: 10 });

  // Build query params
  const queryParams = useTableQuery<GetKaryawansParams>({
    pagination,
    filters,
  });

  // Data fetching
  const { data, isLoading, error } = useKaryawans(queryParams);
  const queryClient = useQueryClient();

  // Handlers
  const {
    handleAdd: handleAddKaryawan,
    handleDelete: handleDeleteKaryawan,
  } = useKaryawanHandlers();

  // Local state untuk dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editKaryawan, setEditKaryawan] = React.useState<Karyawan | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [uploadPhotoKaryawan, setUploadPhotoKaryawan] = React.useState<Karyawan | null>(null);
  const [accessLevelKaryawan, setAccessLevelKaryawan] = React.useState<Karyawan | null>(null);
  const [pinKaryawan, setPinKaryawan] = React.useState<Karyawan | null>(null);
  const [detailKaryawan, setDetailKaryawan] = React.useState<Karyawan | null>(null);
  const [isCreateLoading, setIsCreateLoading] = React.useState(false);
  const [createSuccessData, setCreateSuccessData] = React.useState<Karyawan | null>(null);
  const [setRandomPinConfirmOpen, setSetRandomPinConfirmOpen] = React.useState(false);
  const [setRandomPinLoading, setSetRandomPinLoading] = React.useState(false);
  const [setRandomPinResult, setSetRandomPinResult] = React.useState<{
    updated: number;
    total: number;
    failed: { id: string; nama: string; reason: string }[];
    updatedList: { nama: string; pinCode: string }[];
  } | null>(null);
  const [setRandomPinWaManualNumber, setSetRandomPinWaManualNumber] = React.useState("");
  const [exportNamaPinOpen, setExportNamaPinOpen] = React.useState(false);
  const [exportNamaPinList, setExportNamaPinList] = React.useState<{ nama: string; pinCode: string }[]>([]);
  const [exportNamaPinLoading, setExportNamaPinLoading] = React.useState(false);
  const [exportNamaPinNomor, setExportNamaPinNomor] = React.useState("");
  const [selfServiceLinkResult, setSelfServiceLinkResult] = React.useState<{
    url: string;
    nama: string;
    telepon: string;
  } | null>(null);
  const [aktifkanBiometricKaryawan, setAktifkanBiometricKaryawan] = React.useState<Karyawan | null>(null);
  const [pindahOutletKaryawan, setPindahOutletKaryawan] = React.useState<Karyawan | null>(null);
  const [pindahOutletTargetId, setPindahOutletTargetId] = React.useState<string>("");

  // Fetch gaji hanya saat form tambah/edit dibuka (agar halaman awal cepat)
  const { data: gajisData } = useGajis({ limit: 1000 }, { enabled: formDialogOpen });
  const { data: outletsData } = useOutlets({ limit: 100 }, { enabled: !!pindahOutletKaryawan });
  /** Digit-only untuk input "Kirim ke"; default dari telepon karyawan */
  const [sendToDigits, setSendToDigits] = React.useState("");
  const sendMandiriLinkWa = useSendMandiriLinkWa();
  const pindahOutlet = usePindahOutlet();

  const generateSelfServiceLink = useGenerateSelfServiceLink();
  const aktifkanBiometric = useAktifkanBiometric();

  // Event handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteOpen(true);
  };

  const handleEditClick = (karyawan: Karyawan) => {
    setEditKaryawan(karyawan);
    setFormDialogOpen(true);
  };

  const handleUploadPhotoClick = (karyawan: Karyawan) => {
    setUploadPhotoKaryawan(karyawan);
  };

  const handleAccessLevelClick = (karyawan: Karyawan) => {
    setAccessLevelKaryawan(karyawan);
  };

  const handlePinClick = (karyawan: Karyawan) => {
    setPinKaryawan(karyawan);
  };

  const handleDetailClick = (karyawan: Karyawan) => {
    setDetailKaryawan(karyawan);
  };

  const handleSelfServiceLinkClick = React.useCallback(
    async (karyawan: Karyawan) => {
      try {
        const res = await generateSelfServiceLink.mutateAsync(karyawan.id);
        if (res?.data?.url) {
          setSelfServiceLinkResult({
            url: res.data.url,
            nama: karyawan.nama,
            telepon: karyawan.telepon?.replace(/\D/g, "") ?? "",
          });
        }
      } catch {
        // Error already shown by hook
      }
    },
    [generateSelfServiceLink.mutateAsync]
  );

  const handleAktifkanBiometricClick = React.useCallback((karyawan: Karyawan) => {
    setAktifkanBiometricKaryawan(karyawan);
  }, []);

  const handlePindahOutletClick = React.useCallback((karyawan: Karyawan) => {
    setPindahOutletKaryawan(karyawan);
    setPindahOutletTargetId("");
  }, []);

  const handlePindahOutletSubmit = React.useCallback(async () => {
    if (!pindahOutletKaryawan || !pindahOutletTargetId) return;
    try {
      await pindahOutlet.mutateAsync({ id: pindahOutletKaryawan.id, outletId: pindahOutletTargetId });
      setPindahOutletKaryawan(null);
      setPindahOutletTargetId("");
    } catch {
      // Error shown by hook
    }
  }, [pindahOutletKaryawan, pindahOutletTargetId, pindahOutlet.mutateAsync]);

  const handleAktifkanBiometricSubmit = React.useCallback(async () => {
    if (!aktifkanBiometricKaryawan) return;
    try {
      await aktifkanBiometric.mutateAsync(aktifkanBiometricKaryawan.id);
      setAktifkanBiometricKaryawan(null);
    } catch {
      // Error already shown by hook
    }
  }, [aktifkanBiometricKaryawan, aktifkanBiometric.mutateAsync]);

  const handleCopySelfServiceLink = React.useCallback(() => {
    if (!selfServiceLinkResult?.url) return;
    void navigator.clipboard.writeText(selfServiceLinkResult.url);
    toast.success("Link disalin ke clipboard");
  }, [selfServiceLinkResult?.url]);

  // Set default nomor saat dialog link mandiri dibuka
  React.useEffect(() => {
    if (selfServiceLinkResult) {
      setSendToDigits(selfServiceLinkResult.telepon.replace(/\D/g, "").slice(0, 12));
    }
  }, [selfServiceLinkResult]);

  const handleSendViaWa = React.useCallback(() => {
    if (!selfServiceLinkResult?.url) return;
    const digits = sendToDigits.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Masukkan nomor telepon yang valid");
      return;
    }
    const receiver = phoneToWa(digits);
    sendMandiriLinkWa.mutate({ receiver, url: selfServiceLinkResult.url });
  }, [selfServiceLinkResult?.url, sendToDigits, sendMandiriLinkWa]);

  const handleAdd = React.useCallback(
    async (formData: CreateKaryawanDto) => {
      const isEdit = !!editKaryawan;
      if (isEdit) {
        await handleAddKaryawan(formData, editKaryawan);
        setEditKaryawan(null);
        setFormDialogOpen(false);
      } else {
        setIsCreateLoading(true);
        try {
          const res = await handleAddKaryawan(formData, null);
          const created = res && "data" in res ? res.data : undefined;
          setEditKaryawan(null);
          setFormDialogOpen(false);
          if (created) setCreateSuccessData(created);
        } finally {
          setIsCreateLoading(false);
        }
      }
    },
    [handleAddKaryawan, editKaryawan]
  );

  const handleDelete = async () => {
    if (deleteItem) {
      await handleDeleteKaryawan(deleteItem.id);
      setDeleteItem(null);
    }
  };

  // Gaji options untuk dropdown
  const gajiOptions = React.useMemo(() => {
    if (!gajisData?.data) return [];
    return gajisData.data.map((gaji) => ({
      value: String(gaji.id),
      label: gaji.nama,
    }));
  }, [gajisData]);

  // Memoized configurations
  const columns = React.useMemo(
    () =>
      createKaryawanColumns(
        handleDeleteClick,
        handleEditClick,
        handleUploadPhotoClick,
        handleAccessLevelClick,
        handlePinClick,
        handleDetailClick,
        handleSelfServiceLinkClick,
        handleAktifkanBiometricClick,
        handlePindahOutletClick,
        canManageAccessLevel
      ),
    [handleSelfServiceLinkClick, handleAktifkanBiometricClick, handlePindahOutletClick, canManageAccessLevel]
  );

  const formConfig = React.useMemo(() => {
    const base = createFormConfig(editKaryawan || undefined, gajiOptions);
    return {
      ...base,
      fields: base.fields.map((f) =>
        f.name === "gajiId" ? { ...f, customComponent: GajiSelectWithAdd } : f
      ),
    };
  }, [editKaryawan, gajiOptions]);

  const filterConfigs = React.useMemo(() => createKaryawanFilterConfigs(), []);

  const formConfigWithSubmit = React.useMemo(
    () => ({
      ...formConfig,
      onSubmit: handleAdd,
    }),
    [formConfig, handleAdd]
  );

  const handleSetRandomPinAll = React.useCallback(async () => {
    setSetRandomPinConfirmOpen(false);
    setSetRandomPinLoading(true);
    try {
      const res = await karyawanService.setRandomPinAll();
      if (res.data) {
        const { updated, failed, updatedList } = res.data;
        const total = updated + (failed?.length ?? 0);
        setSetRandomPinResult({
          updated,
          total,
          failed: failed ?? [],
          updatedList: updatedList ?? [],
        });
        setSetRandomPinWaManualNumber("");
        queryClient.invalidateQueries({ queryKey: karyawanKeys.lists() });
      } else {
        toast.error(res.message || "Gagal set random PIN");
      }
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "response" in e
        ? (e as { response?: { data?: { message?: string }; message?: string } }).response?.data?.message
          ?? (e as { message?: string }).message
        : (e as Error)?.message;
      toast.error(msg || "Gagal set random PIN");
    } finally {
      setSetRandomPinLoading(false);
    }
  }, [queryClient]);

  // Loading & Error states
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data karyawan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data karyawan"}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTables
        title="Karyawan"
        description="Kelola data karyawan di sini"
        data={data?.data || []}
        columns={columns}
        formConfig={formConfigWithSubmit}
        onDelete={handleDelete}
        enableRowSelection={true}
        enableColumnVisibility={true}
        enablePagination={true}
        pageSize={pagination.pageSize}
        pageCount={data?.pagination?.totalPages}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        emptyMessage="Tidak ada karyawan ditemukan"
        getRowId={(row) => String(row.id)}
        getNameFromRow={(row) => row.nama}
        filterConfigs={filterConfigs}
        filterValues={filters}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        formDialogOpen={formDialogOpen}
        onFormDialogOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditKaryawan(null);
        }}
        onAddClick={() => {
          setEditKaryawan(null);
          setFormDialogOpen(true);
        }}
        customButtons={
          canManageAccessLevel ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSetRandomPinConfirmOpen(true)}
                disabled={setRandomPinLoading}
              >
                {setRandomPinLoading ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <KeyRound className="size-4 mr-2" />
                )}
                Set random PIN semua
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setExportNamaPinOpen(true);
                  setExportNamaPinNomor("");
                  setExportNamaPinLoading(true);
                  try {
                    const res = await karyawanService.exportNamaPin();
                    setExportNamaPinList(res.list ?? []);
                  } catch (e: unknown) {
                    const msg = e && typeof e === "object" && "message" in e
                      ? String((e as { message?: string }).message)
                      : "Gagal memuat daftar karyawan";
                    toast.error(msg);
                    setExportNamaPinOpen(false);
                  } finally {
                    setExportNamaPinLoading(false);
                  }
                }}
              >
                <FileDown className="size-4 mr-2" />
                Export daftar Nama & PIN
              </Button>
            </>
          ) : undefined
        }
      />

      <KaryawanUploadPhotoSheet
        open={!!uploadPhotoKaryawan}
        onOpenChange={(open) => !open && setUploadPhotoKaryawan(null)}
        karyawan={uploadPhotoKaryawan}
      />

      <KaryawanAccessLevelSheet
        open={!!accessLevelKaryawan}
        onOpenChange={(open) => !open && setAccessLevelKaryawan(null)}
        karyawan={accessLevelKaryawan}
      />

      <KaryawanPinSheet
        open={!!pinKaryawan}
        onOpenChange={(open) => !open && setPinKaryawan(null)}
        karyawan={pinKaryawan}
      />

      <Dialog open={isCreateLoading} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false} onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="size-10 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="font-medium">Membuat karyawan...</p>
              <p className="text-sm text-muted-foreground">
                Mendaftarkan ke device Hik, mengatur PIN unik. Mohon tunggu.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={setRandomPinConfirmOpen} onOpenChange={setSetRandomPinConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set random PIN semua</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Set PIN acak 6 digit untuk semua karyawan di outlet ini? PIN akan di-update di device Hik dan database.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetRandomPinConfirmOpen(false)} disabled={setRandomPinLoading}>
              Batal
            </Button>
            <Button onClick={handleSetRandomPinAll} disabled={setRandomPinLoading}>
              Set PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={setRandomPinLoading} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false} onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogTitle className="sr-only">Memproses set PIN acak</DialogTitle>
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="size-10 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="font-medium">Memproses set PIN acak...</p>
              <p className="text-sm text-muted-foreground">
                PIN 6 digit acak untuk semua karyawan di outlet ini akan di-update di device Hik dan database. Mohon tunggu.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!setRandomPinResult} onOpenChange={(open) => { if (!open) { setSetRandomPinResult(null); setSetRandomPinWaManualNumber(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hasil Set random PIN semua</DialogTitle>
          </DialogHeader>
          {setRandomPinResult && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <p className="text-center text-lg font-semibold">
                  {setRandomPinResult.updated} dari {setRandomPinResult.total} karyawan berhasil di-update
                </p>
                {setRandomPinResult.failed.length > 0 && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="size-4 shrink-0" />
                    {setRandomPinResult.failed.length} gagal (dilewati)
                  </p>
                )}
              </div>
              {setRandomPinResult.updatedList.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Kirim daftar Nama & PIN ke WhatsApp</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const lines = setRandomPinResult.updatedList.map((row, i) => `${i + 1}. ${row.nama} - ${row.pinCode}`);
                        const text = `Daftar Nama & PIN (Set Acak)\n\n${lines.join("\n")}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <MessageCircle className="size-4" />
                      Kirim ke WhatsApp
                    </Button>
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nomor tujuan (contoh: 0812...)"
                          value={formatPhoneId(setRandomPinWaManualNumber)}
                          onChange={(e) => setSetRandomPinWaManualNumber(e.target.value.replace(/\D/g, ""))}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 shrink-0"
                          onClick={() => {
                            const num = setRandomPinWaManualNumber.replace(/\D/g, "").trim();
                            if (!num) {
                              toast.error("Isi nomor tujuan dulu");
                              return;
                            }
                            const lines = setRandomPinResult.updatedList.map((row, i) => `${i + 1}. ${row.nama} - ${row.pinCode}`);
                            const text = `Daftar Nama & PIN (Set Acak)\n\n${lines.join("\n")}`;
                            window.open(`https://wa.me/${phoneToWa(num)}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
                          }}
                        >
                          <MessageCircle className="size-4" />
                          Buka WhatsApp
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Manual: isi nomor lalu klik Buka WhatsApp</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setSetRandomPinResult(null); setSetRandomPinWaManualNumber(""); }}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={exportNamaPinOpen} onOpenChange={(open) => { if (!open) { setExportNamaPinOpen(false); setExportNamaPinNomor(""); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Export daftar Nama & PIN</DialogTitle>
          </DialogHeader>
          {exportNamaPinLoading ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat daftar karyawan...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Teks di bawah bisa dikirim ke WhatsApp. Isi nomor tujuan (opsional) lalu klik Kirim ke WhatsApp.
              </p>
              <pre className="rounded-lg border bg-muted/50 p-3 text-xs overflow-auto max-h-48 whitespace-pre-wrap font-sans">
                {exportNamaPinList.length === 0
                  ? "Tidak ada data."
                  : `Daftar Nama & PIN\n${"─".repeat(24)}\n\n${exportNamaPinList.map((row, i) => `${String(i + 1).padStart(2)}. ${row.nama} - ${row.pinCode || "—"}`).join("\n")}`}
              </pre>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Nomor tujuan (opsional)</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Contoh: 0812-3456-7890"
                    value={formatPhoneId(exportNamaPinNomor)}
                    onChange={(e) => setExportNamaPinNomor(e.target.value.replace(/\D/g, ""))}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    className="gap-2 shrink-0"
                    onClick={() => {
                      const lines = exportNamaPinList.map((row, i) => `${String(i + 1).padStart(2)}. ${row.nama} - ${row.pinCode || "—"}`);
                      const text = `Daftar Nama & PIN\n${"─".repeat(24)}\n\n${lines.join("\n")}`;
                      const num = exportNamaPinNomor.replace(/\D/g, "").trim();
                      if (num) {
                        window.open(`https://wa.me/${phoneToWa(num)}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
                      } else {
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    <MessageCircle className="size-4" />
                    Kirim ke WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setExportNamaPinOpen(false); setExportNamaPinNomor(""); }}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createSuccessData} onOpenChange={(open) => !open && setCreateSuccessData(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="size-5" />
              Karyawan berhasil dibuat
            </DialogTitle>
          </DialogHeader>
          {createSuccessData && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={createSuccessData.headPicUrl ?? undefined} alt={createSuccessData.nama} />
                  <AvatarFallback className="text-lg">
                    {createSuccessData.nama.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{createSuccessData.nama}</p>
                  {createSuccessData.gaji && (
                    <p className="text-sm text-muted-foreground">Gaji: {createSuccessData.gaji.nama}</p>
                  )}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <p className="text-sm font-medium">PIN absen (untuk device)</p>
                <p className="font-mono text-lg">{createSuccessData.pinCode ?? "—"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreateSuccessData(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KaryawanDetailSheet
        open={!!detailKaryawan}
        onOpenChange={(open) => !open && setDetailKaryawan(null)}
        karyawan={detailKaryawan}
      />

      {deleteItem && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          itemName={deleteItem.name}
          itemType="karyawan"
        />
      )}

      <Dialog
        open={!!aktifkanBiometricKaryawan}
        onOpenChange={(open) => !open && setAktifkanBiometricKaryawan(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="size-5" />
              Aktifkan biometric — {aktifkanBiometricKaryawan?.nama}
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Untuk absen di device dibutuhkan <strong>PIN</strong> dan/atau <strong>wajah (foto)</strong>. Setelah aktivasi berhasil, langkah yang harus Anda lakukan:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><strong>Upload foto</strong> wajah (menu ⋮ → Upload foto) agar bisa absen dengan wajah.</li>
            <li>Berikan <strong>PIN</strong> ke karyawan (menu ⋮ → Ganti PIN) agar bisa absen dengan PIN.</li>
            <li>Pastikan karyawan <strong>mencoba absen</strong> di device (wajah atau PIN) untuk memastikan terdaftar.</li>
          </ol>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAktifkanBiometricKaryawan(null)}
              disabled={aktifkanBiometric.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleAktifkanBiometricSubmit}
              disabled={aktifkanBiometric.isPending}
            >
              {aktifkanBiometric.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Aktifkan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!pindahOutletKaryawan}
        onOpenChange={(open) => {
          if (!open) {
            setPindahOutletKaryawan(null);
            setPindahOutletTargetId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-5" />
              Pindah outlet — {pindahOutletKaryawan?.nama}
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Pilih outlet tujuan. Gaji karyawan akan direset dan bisa di-assign ulang di outlet baru.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Outlet tujuan</label>
            <Select
              value={pindahOutletTargetId}
              onValueChange={setPindahOutletTargetId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih outlet" />
              </SelectTrigger>
              <SelectContent>
                {(outletsData?.data ?? [])
                  .filter((o) => o.id !== pindahOutletKaryawan?.outletId)
                  .map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.nama}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPindahOutletKaryawan(null);
                setPindahOutletTargetId("");
              }}
              disabled={pindahOutlet.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handlePindahOutletSubmit}
              disabled={!pindahOutletTargetId || pindahOutlet.isPending}
            >
              {pindahOutlet.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Pindah"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selfServiceLinkResult}
        onOpenChange={(open) => !open && setSelfServiceLinkResult(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Link form mandiri — {selfServiceLinkResult?.nama}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Kirim link ini ke karyawan agar bisa upload foto dan ganti PIN
              mandiri. Link berlaku 7 hari.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={selfServiceLinkResult?.url ?? ""}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopySelfServiceLink}
                title="Salin link"
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <div className="space-y-2 gap-1 flex-col flex">
              <label className="text-muted-foreground text-sm mb-1">
                Kirim ke nomor (default: telepon karyawan, kosong isi manual)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="08xx-xxxx-xxxx"
                value={formatPhoneId(sendToDigits)}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                  setSendToDigits(digits);
                }}
                className="font-mono"
                maxLength={14}
              />
              <Button
                type="button"
                onClick={handleSendViaWa}
                disabled={sendMandiriLinkWa.isPending}
                className="w-full sm:w-auto"
              >
                {sendMandiriLinkWa.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <MessageCircle className="mr-2 size-4" />
                )}
                Kirim via WhatsApp
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelfServiceLinkResult(null)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function KaryawanPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Memuat...</div>}>
      <KaryawanContent />
    </Suspense>
  );
}