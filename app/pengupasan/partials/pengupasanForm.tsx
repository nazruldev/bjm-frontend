"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { JumlahKgInput } from "@/components/ui/jumlah-kg-input";
import { parseNumberID, formatCurrency, formatJumlahKg, parseCurrency, getTodayDateString } from "@/lib/utils";
import type { CreatePengupasanDto } from "@/services/pengupasanService";
import { useMutasiStokByProduk } from "@/hooks/useMutasiStoks";
import { useAuth } from "@/hooks/useAuth";
import { useOutlet, useCurrentOutlet } from "@/hooks/useOutlets";
import { useProduks } from "@/hooks/useProduks";

// Komponen DatePickerField terpisah untuk menghindari Rules of Hooks violation
function DatePickerField({
  field,
  label,
  placeholder = "Pilih tanggal",
  allowPast = false,
}: {
  field: any;
  label: string;
  placeholder?: string;
  allowPast?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const raw = field.state.value;
  const value =
    typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? raw
      : getTodayDateString();
  const selectedDate = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
          >
            {value ? (
              value
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            captionLayout="dropdown"
            disabled={allowPast ? undefined : (date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const d = new Date(date);
              d.setHours(0, 0, 0, 0);
              return d < today;
            }}
            onSelect={(date) => {
              if (!date) return;
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, "0");
              const d = String(date.getDate()).padStart(2, "0");
              field.handleChange(`${y}-${m}-${d}`);
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

// Schema dengan validasi stok dinamis
const createPengupasanSchema = (stokTersedia: number) =>
  z.object({
    pekerjaId: z.string().min(1, "Pekerja wajib diisi"),
    produkJumlah: z.preprocess(
      (val) => {
        if (typeof val === "string") {
          if (val === "" || val === null || val === undefined) return 0;
          const parsed = parseNumberID(val);
          return isNaN(parsed) ? 0 : parsed;
        }
        if (val === null || val === undefined) return 0;
        return typeof val === "number" ? val : 0;
      },
      z
        .number()
        .refine((val) => val > 0, {
          message: "Jumlah wajib diisi dan harus positif",
        })
        .refine((val) => val <= stokTersedia, {
          message: `Jumlah tidak boleh melebihi stok tersedia (${formatJumlahKg(stokTersedia)} kg)`,
        })
    ),
    tanggal_mulai: z.union([z.string(), z.date()]).optional(),
    createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    catatan: z.string().optional().nullable(),
  });

interface PengupasanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pekerjaOptions: { value: string; label: string; tarifPerKg?: number }[];
  onSubmit: (data: CreatePengupasanDto) => Promise<void>;
}

export function PengupasanForm({
  open,
  onOpenChange,
  pekerjaOptions,
  onSubmit,
}: PengupasanFormProps) {
  const [selectedPekerjaId, setSelectedPekerjaId] = React.useState("");
  const tarifPengupas =
    selectedPekerjaId
      ? (pekerjaOptions.find((o) => o.value === selectedPekerjaId)?.tarifPerKg ?? 0)
      : 0;
  const { user } = useAuth();
  // OWNER/ADMIN: outlet aktif dari pilihan (localStorage selectedOutletId); lainnya dari user.outletId
  const [selectedOutletId, setSelectedOutletId] = React.useState<string>("");
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setSelectedOutletId(localStorage.getItem("selectedOutletId") || "");
    } catch {
      // ignore
    }
  }, [open]);
  const activeOutletId =
    user?.role === "OWNER" || user?.role === "ADMIN"
      ? selectedOutletId || user?.outletId || null
      : user?.outletId || null;
  const { data: currentOutletData } = useCurrentOutlet(activeOutletId, {
    enabled: !!activeOutletId && open,
  });
  const outletFromCurrent = currentOutletData?.data ?? null;
  const outletFromUser = user?.outlet || null;
  const { data: outletData } = useOutlet(
    user?.outletId && !outletFromUser && !outletFromCurrent ? user.outletId : null
  );
  const outletFromApi = outletData?.data;
  const finalOutlet = outletFromCurrent || outletFromUser || outletFromApi;

  // Cari produk kemiri kering berdasarkan ids "JMK"
  const { data: produkData } = useProduks({ limit: 1000 });
  const produkKemiriKering = React.useMemo(() => {
    const found = produkData?.data?.find(
      (p) => p.ids === "JMK" && !p.deletedAt
    );
    if (!found && produkData?.data) {
      console.warn(
        "Produk Kemiri Kering (ids: JMK) tidak ditemukan. Produk yang ada:",
        produkData.data
          .filter((p) => !p.deletedAt)
          .map((p) => ({ id: p.id, nama: p.nama_produk, ids: p.ids }))
      );
    }
    return found;
  }, [produkData]);

  // Fetch stok produk input dari mutasi stok
  const produkInputId = produkKemiriKering?.id;
  const {
    data: stokData,
    isLoading: isLoadingStok,
    error: stokError,
  } = useMutasiStokByProduk(
    produkInputId || null,
    { limit: 1 } // Hanya butuh saldo, tidak perlu data detail
  );

  // Hitung stok tersedia
  const stokTersedia = React.useMemo(() => {
    if (!produkInputId) {
      console.warn("Produk input ID tidak ada");
      return 0;
    }
    if (!stokData) {
      if (stokError) {
        console.error("Error fetching stok:", stokError);
      }
      return 0;
    }
    if (!stokData.saldo) {
      console.warn("Saldo tidak ada di response:", stokData);
      return 0;
    }
    const saldo = stokData.saldo;
    const raw = saldo.saldoAkhir ?? 0;
    const saldoAkhir = typeof raw === "string" ? parseFloat(raw) : Number(raw);
    const value = Number.isFinite(saldoAkhir) ? saldoAkhir : 0;
    return value;
  }, [stokData, produkInputId, stokError]);

  // Schema dengan validasi stok dinamis
  const pengupasanSchemaMemo = React.useMemo(
    () => createPengupasanSchema(stokTersedia),
    [stokTersedia]
  );

  // Get today's date (start of day) untuk default
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const form = useForm({
    defaultValues: {
      pekerjaId: "",
      produkJumlah: "",
      tanggal_mulai: getTodayString(),
      createdAt: getTodayString(),
      catatan: "",
    } as any,
    validators: {
      onSubmit: pengupasanSchemaMemo as any,
    },
    onSubmit: async ({ value }) => {
      try {
        // Parse produkJumlah (id-ID format dari JumlahKgInput)
        const produkJumlahValue =
          typeof value.produkJumlah === "string"
            ? parseNumberID(value.produkJumlah)
            : (value.produkJumlah ?? 0);

        // Normalize tanggal_mulai untuk menghindari timezone issues
        let tanggalMulaiValue: string | undefined;

        if (
          typeof value.tanggal_mulai === "string" &&
          value.tanggal_mulai !== ""
        ) {
          // Sudah YYYY-MM-DD, kirim langsung
          tanggalMulaiValue = value.tanggal_mulai;
        }

        const payload: CreatePengupasanDto = {
          pekerjaId: value.pekerjaId,
          produkJumlah: produkJumlahValue,
          tanggal_mulai: tanggalMulaiValue,
          createdAt: typeof value.createdAt === "string" && value.createdAt ? value.createdAt : undefined,
          catatan: "Proses pengupasan dicatat secara otomatis.",
        };

        await onSubmit(payload);
        form.reset();
        onOpenChange(false);
      } catch (error) {
        toast.error("Terjadi kesalahan saat menyimpan data");
      }
    },
  });

  // Reset produkJumlah jika jumlah melebihi stok baru
  React.useEffect(() => {
    if (produkInputId && stokTersedia > 0) {
      const currentJumlah = form.state.values.produkJumlah;
      if (currentJumlah) {
        const parsedJumlah =
          typeof currentJumlah === "string"
            ? parseNumberID(currentJumlah) || 0
            : currentJumlah || 0;

        if (parsedJumlah > stokTersedia) {
          form.setFieldValue(
            "produkJumlah",
            stokTersedia.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 3 })
          );
        }
      }
    }
  }, [produkInputId, stokTersedia, form]);

  React.useEffect(() => {
    if (open) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const todayString = `${year}-${month}-${day}`;
      
      form.reset({
        pekerjaId: "",
        produkJumlah: "",
        tanggal_mulai: todayString,
        createdAt: todayString,
        catatan: "",
      } as any);
      setSelectedPekerjaId("");
    }
  }, [open, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 max-h-screen">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>Tambah Pengupasan</SheetTitle>
          <SheetDescription>
            {`Isi form di bawah ini untuk menambah pengupasan baru. Upah otomatis: ${formatCurrency(
              tarifPengupas
            )} per kg`}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4">
            {/* Pekerja */}
            <form.Field name="pekerjaId">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Pekerja *</FieldLabel>
                  <Select
                    value={field.state.value || ""}
                    onValueChange={(value) => {
                      field.handleChange(value);
                      setSelectedPekerjaId(value || "");
                    }}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Pilih pekerja" />
                    </SelectTrigger>
                    <SelectContent>
                      {pekerjaOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.isTouched && !field.state.meta.isValid && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </Field>
              )}
            </form.Field>

            {/* Tanggal Mulai */}
            <form.Field name="tanggal_mulai">
              {(field) => (
                <DatePickerField
                  field={field}
                  label="Tanggal Mulai (Opsional)"
                  placeholder="Pilih tanggal"
                  allowPast
                />
              )}
            </form.Field>

            {/* Tanggal transaksi (created_at) — manual */}
            <form.Field name="createdAt">
              {(field) => (
                <DatePickerField
                  field={field}
                  label="Tanggal transaksi (created_at)"
                  placeholder="Pilih tanggal"
                  allowPast
                />
              )}
            </form.Field>

            {/* Jumlah Produk Input */}
            <form.Field name="produkJumlah">
              {(field) => {
                const rawStr = (field.state.value as string) ?? "";
                const currentValue = parseNumberID(rawStr);
                const isExceeded = currentValue > stokTersedia;
                const satuan = produkKemiriKering?.satuan || "kg";

                const handleJumlahChange = (value: string) => {
                  const parsed = parseNumberID(value);
                  let finalValue = value;
                  if (
                    !isNaN(parsed) &&
                    parsed > stokTersedia &&
                    produkInputId
                  ) {
                    finalValue = stokTersedia.toLocaleString("id-ID", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 3,
                    });
                  }
                  field.handleChange(finalValue);
                };

                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Jumlah Produk Input *{" "}
                      {produkKemiriKering &&
                        `(${produkKemiriKering.nama_produk})`}
                    </FieldLabel>
                    {!produkKemiriKering ? (
                      <div className="text-sm text-destructive mb-1">
                        ⚠️ Produk Kemiri Kering (ids: JMK) tidak ditemukan.
                        Pastikan produk sudah dibuat di database.
                      </div>
                    ) : produkInputId ? (
                      <div className="text-sm text-muted-foreground mb-1 flex flex-col">
                        {isLoadingStok ? (
                          <span>Memuat stok...</span>
                        ) : (
                          <>
                            Stok tersedia:{" "}
                            <span className="font-semibold">
                              {formatJumlahKg(stokTersedia)} {satuan}
                            </span>
                            {stokTersedia === 0 && (
                              <div className="text-destructive text-xs">
                                (Stok kosong - belum ada penjemuran untuk produk
                                ini)
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : null}
                    <JumlahKgInput
                      id={field.name}
                      value={rawStr}
                      onChange={handleJumlahChange}
                      onBlur={() => field.handleBlur()}
                      satuan={satuan}
                      className={isExceeded ? "border-destructive focus-visible:ring-destructive" : ""}
                      aria-invalid={isExceeded}
                    />
                    {isExceeded && (
                      <div className="text-sm text-destructive mt-1">
                        Jumlah melebihi stok tersedia ({formatJumlahKg(stokTersedia)}{" "}
                        {satuan})
                      </div>
                    )}
                    {field.state.meta.isTouched &&
                      !field.state.meta.isValid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                  </Field>
                );
              }}
            </form.Field>

            {/* Upah Satuan - Readonly dari config outlet */}
            <Field>
              <FieldLabel>Upah Satuan</FieldLabel>
              <div className="relative">
                <Input
                  type="text"
                  value={formatCurrency(tarifPengupas)}
                  disabled
                  readOnly
                  className="pr-10 bg-muted/50"
                />
                <span className="absolute uppercase right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                  /kg
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total upah akan dihitung berdasarkan jumlah kemiri campur saat konfirmasi
              </div>
            </Field>

          </div>

          <SheetFooter className="px-6 pb-6 pt-4 border-t shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
