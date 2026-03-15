"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { JumlahKgInput } from "@/components/ui/jumlah-kg-input";
import { parseNumberID, formatJumlahKg, getTodayDateString, toLocalDateStringOnly } from "@/lib/utils";
import { useConfirmPassword } from "@/components/dialog-confirm-password";
import type {
  ConfirmPensortiranDto,
  Pensortiran,
} from "@/services/pensortiranService";
import { Separator } from "@/components/ui/separator";

const todayString = () => getTodayDateString();

const toDate = (dateString: string) => {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
};

function DatePickerField({
  field,
  label,
  placeholder = "Pilih tanggal",
  minDateString,
  defaultMonth,
}: {
  field: any;
  label: string;
  placeholder?: string;
  minDateString?: string;
  defaultMonth?: Date;
}) {
  const [open, setOpen] = React.useState(false);

  const raw = field.state.value;
  const value =
    typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? raw
      : "";

  const selectedDate = value ? toDate(value) : undefined;
  const minDate = minDateString ? toDate(minDateString) : undefined;

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
          >
            {value ? value : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <CalendarIcon className="ml-2 size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={defaultMonth || selectedDate || minDate || new Date()}
            disabled={(date) => {
              if (!minDate) return false;
              const d = new Date(date);
              d.setHours(0, 0, 0, 0);
              const min = new Date(minDate);
              min.setHours(0, 0, 0, 0);
              return d < min;
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

// Schema dengan validasi dinamis berdasarkan pensortiran
const createConfirmSchema = (totalInput: number, tanggalMulai: Date) =>
  z
    .object({
      tanggal_selesai: z
        .union([z.date(), z.string()])
        .refine(
          (val) => {
            if (!val) return false;
            if (typeof val === "string") {
              if (val.trim() === "") return false;
              const date = new Date(val);
              return !isNaN(date.getTime());
            }
            return val instanceof Date && !isNaN(val.getTime());
          },
          {
            message: "Tanggal selesai wajib diisi",
          }
        )
        .transform((val) => {
          if (typeof val === "string") {
            return new Date(val);
          }
          return val;
        }),
      jumlah_menir: z.preprocess(
        (val) => {
          if (typeof val === "string") {
            if (val === "" || val === null || val === undefined) return null;
            const parsed = parseNumberID(val);
            return isNaN(parsed) ? null : parsed;
          }
          return val === null || val === undefined ? null : Number(val);
        },
        z.number().min(0, "Jumlah menir harus >= 0").nullable().optional()
      ),
      jumlah_abu: z.preprocess(
        (val) => {
          if (typeof val === "string") {
            if (val === "" || val === null || val === undefined) return null;
            const parsed = parseNumberID(val);
            return isNaN(parsed) ? null : parsed;
          }
          return val === null || val === undefined ? null : Number(val);
        },
        z.number().min(0, "Jumlah abu harus >= 0").nullable().optional()
      ),
      jumlah_keping: z.preprocess(
        (val) => {
          if (typeof val === "string") {
            if (val === "" || val === null || val === undefined) return null;
            const parsed = parseNumberID(val);
            return isNaN(parsed) ? null : parsed;
          }
          return val === null || val === undefined ? null : Number(val);
        },
        z.number().min(0, "Jumlah keping harus >= 0").nullable().optional()
      ),
      jumlah_bulat: z.preprocess(
        (val) => {
          if (typeof val === "string") {
            if (val === "" || val === null || val === undefined) return null;
            const parsed = parseNumberID(val);
            return isNaN(parsed) ? null : parsed;
          }
          return val === null || val === undefined ? null : Number(val);
        },
        z.number().min(0, "Jumlah bulat harus >= 0").nullable().optional()
      ),
      jumlah_busuk: z.preprocess(
        (val) => {
          if (typeof val === "string") {
            if (val === "" || val === null || val === undefined) return null;
            const parsed = parseNumberID(val);
            return isNaN(parsed) ? null : parsed;
          }
          return val === null || val === undefined ? null : Number(val);
        },
        z.number().min(0, "Jumlah busuk harus >= 0").nullable().optional()
      ),
      catatan: z.string().optional().nullable(),
    })
    .superRefine((data, ctx) => {
      // Validasi: tanggal selesai tidak boleh sebelum tanggal mulai
      const tanggalSelesai =
        typeof data.tanggal_selesai === "string"
          ? new Date(data.tanggal_selesai)
          : data.tanggal_selesai;
      if (tanggalSelesai < tanggalMulai) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
          path: ["tanggal_selesai"],
        });
      }

      // Validasi: minimal salah satu hasil (selain busuk) harus diisi
      const jumlahMenir = Number(data.jumlah_menir || 0);
      const jumlahAbu = Number(data.jumlah_abu || 0);
      const jumlahKeping = Number(data.jumlah_keping || 0);
      const jumlahBulat = Number(data.jumlah_bulat || 0);
      const jumlahBusuk = Number(data.jumlah_busuk || 0);
      
      const totalHasilProduk = jumlahMenir + jumlahAbu + jumlahKeping + jumlahBulat;
      const totalHasil = totalHasilProduk + jumlahBusuk;

      if (totalHasilProduk === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Minimal salah satu hasil sortir (Menir, Abu, Keping, atau Bulat) harus diisi",
          path: ["jumlah_menir"],
        });
      }

      // Validasi: total hasil tidak boleh melebihi input
      if (totalHasil > totalInput) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Total hasil (${formatJumlahKg(totalHasil)} kg) tidak boleh melebihi jumlah input (${formatJumlahKg(totalInput)} kg)`,
        });
      }
    });

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pensortiran: Pensortiran;
  onSubmit: (data: ConfirmPensortiranDto) => Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  pensortiran,
  onSubmit,
}: ConfirmDialogProps) {
  const { openConfirmPassword } = useConfirmPassword();
  const pendingPayloadRef = React.useRef<ConfirmPensortiranDto | null>(null);

  const totalInput = Number(pensortiran.produkJumlah);
  const tanggalMulai =
    typeof pensortiran.tanggal_mulai === "string"
      ? new Date(pensortiran.tanggal_mulai)
      : pensortiran.tanggal_mulai;

  const confirmSchemaMemo = React.useMemo(
    () => createConfirmSchema(totalInput, tanggalMulai),
    [totalInput, tanggalMulai]
  );

  const form = useForm({
    defaultValues: {
      tanggal_selesai: todayString(),
      jumlah_menir: "",
      jumlah_abu: "",
      jumlah_keping: "",
      jumlah_bulat: "",
      jumlah_busuk: "",
      catatan: pensortiran.catatan || "",
    } as any,
    validators: {
      onSubmit: confirmSchemaMemo as any,
    },
    onSubmit: async ({ value }) => {
      try {
        // Parse semua jumlah (id-ID format dari JumlahKgInput)
        const parseJumlahValue = (val: string | number | null | undefined) => {
          if (val === null || val === undefined || val === "") return null;
          if (typeof val === "number") return val;
          const parsed = parseNumberID(val);
          return isNaN(parsed) ? null : parsed;
        };

        const payload: ConfirmPensortiranDto = {
          tanggal_selesai:
            typeof value.tanggal_selesai === "string"
              ? value.tanggal_selesai
              : toLocalDateStringOnly(value.tanggal_selesai),
          jumlah_menir: parseJumlahValue(value.jumlah_menir),
          jumlah_abu: parseJumlahValue(value.jumlah_abu),
          jumlah_keping: parseJumlahValue(value.jumlah_keping),
          jumlah_bulat: parseJumlahValue(value.jumlah_bulat),
          jumlah_busuk: parseJumlahValue(value.jumlah_busuk),
          catatan: "Hasil pensortiran dicatat secara otomatis.",
        };

        pendingPayloadRef.current = payload;
        openConfirmPassword({
          title: "Konfirmasi password",
          description: "Masukkan password Anda untuk melanjutkan konfirmasi pensortiran.",
          onConfirm: handleConfirmAfterPassword,
        });
        return;
      } catch (error) {
        toast.error("Terjadi kesalahan saat mengonfirmasi pensortiran");
      }
    },
  });

  const handleConfirmAfterPassword = React.useCallback(async () => {
    const payload = pendingPayloadRef.current;
    if (!payload) return;
    try {
      await onSubmit(payload);
      form.reset();
      onOpenChange(false);
      pendingPayloadRef.current = null;
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengonfirmasi pensortiran");
    }
  }, [onSubmit, form, onOpenChange]);

  React.useEffect(() => {
    if (open) {
      form.reset({
        tanggal_selesai: todayString(),
        jumlah_menir: "",
        jumlah_abu: "",
        jumlah_keping: "",
        jumlah_bulat: "",
        jumlah_busuk: "",
        catatan: pensortiran.catatan || "",
      } as any);
    }
  }, [open, form, pensortiran]);

  // Calculate total hasil untuk display
  const calculateTotalHasil = React.useCallback(() => {
    const menir = parseNumberID(form.state.values.jumlah_menir || "0");
    const abu = parseNumberID(form.state.values.jumlah_abu || "0");
    const keping = parseNumberID(form.state.values.jumlah_keping || "0");
    const bulat = parseNumberID(form.state.values.jumlah_bulat || "0");
    const busuk = parseNumberID(form.state.values.jumlah_busuk || "0");
    return menir + abu + keping + bulat + busuk;
  }, [form.state.values]);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <div className="shrink-0 px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pensortiran</DialogTitle>
            <DialogDescription>
              Masukkan hasil sortir untuk pensortiran ini. Invoice: {pensortiran.invoice || pensortiran.id}
            </DialogDescription>
          </DialogHeader>
         
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Info Pensortiran */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Jumlah Input:</span>
                <div className="font-semibold">{formatJumlahKg(totalInput)} kg</div>
              </div>
              <div>
                <span className="text-muted-foreground">Inspector:</span>
                <div className="font-semibold">
                  {pensortiran.inspector?.nama || "-"}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Tanggal Mulai:</span>
                <div className="font-semibold">
                  {tanggalMulai.toLocaleDateString("id-ID")}
                </div>
              </div>
            </div>
          </div>

          {/* Tanggal Selesai */}
          <div className="max-w-xs">
          <form.Field name="tanggal_selesai" >
            {(field) => (
              <DatePickerField
                field={field}
                label="Tanggal Selesai *"
                placeholder="Pilih tanggal selesai"
                minDateString={
                  typeof pensortiran.tanggal_mulai === "string"
                    ? pensortiran.tanggal_mulai
                    : toLocalDateStringOnly(pensortiran.tanggal_mulai)
                }
                defaultMonth={tanggalMulai}
              />
            )}
          </form.Field>
          </div>

          {/* Hasil Sortir */}
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold">Hasil Sortir *</div>
              <div className="text-xs text-muted-foreground mt-1">
                Minimal salah satu hasil (Menir, Abu, Keping, atau Bulat) harus diisi. Busuk bersifat opsional.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
               
            {/* Menir */}
            <form.Field name="jumlah_menir">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Jumlah Menir (kg) *</FieldLabel>
                  <JumlahKgInput
                    id={field.name}
                    value={(field.state.value as string) ?? ""}
                    onChange={(v) => field.handleChange(v)}
                    onBlur={() => field.handleBlur()}
                    satuan="kg"
                  />
                </Field>
              )}
            </form.Field>

            {/* Abu */}
            <form.Field name="jumlah_abu">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Jumlah Abu (kg) *</FieldLabel>
                  <JumlahKgInput
                    id={field.name}
                    value={(field.state.value as string) ?? ""}
                    onChange={(v) => field.handleChange(v)}
                    onBlur={() => field.handleBlur()}
                    satuan="kg"
                  />
                </Field>
              )}
            </form.Field>

            {/* Keping */}
            <form.Field name="jumlah_keping">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Jumlah Keping (kg) *</FieldLabel>
                  <JumlahKgInput
                    id={field.name}
                    value={(field.state.value as string) ?? ""}
                    onChange={(v) => field.handleChange(v)}
                    onBlur={() => field.handleBlur()}
                    satuan="kg"
                  />
                </Field>
              )}
            </form.Field>

            {/* Bulat */}
            <form.Field name="jumlah_bulat">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Jumlah Bulat (kg) *</FieldLabel>
                  <JumlahKgInput
                    id={field.name}
                    value={(field.state.value as string) ?? ""}
                    onChange={(v) => field.handleChange(v)}
                    onBlur={() => field.handleBlur()}
                    satuan="kg"
                  />
                </Field>
              )}
            </form.Field>

            {/* Busuk */}
            <form.Field name="jumlah_busuk">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Jumlah Busuk (kg) - Tidak masuk stok
                  </FieldLabel>
                  <JumlahKgInput
                    id={field.name}
                    value={(field.state.value as string) ?? ""}
                    onChange={(v) => field.handleChange(v)}
                    onBlur={() => field.handleBlur()}
                    satuan="kg"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Busuk tidak akan masuk ke stok
                  </div>
                </Field>
              )}
            </form.Field>
            </div>

            {/* Total Hasil */}
            <form.Subscribe
              selector={(state) => [
                state.values.jumlah_menir,
                state.values.jumlah_abu,
                state.values.jumlah_keping,
                state.values.jumlah_bulat,
                state.values.jumlah_busuk,
              ]}
            >
              {([menir, abu, keping, bulat, busuk]) => {
                const totalHasil = calculateTotalHasil();
                const sisa = totalInput - totalHasil;
                const isExceeded = totalHasil > totalInput;

                return (
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Input:</span>
                        <div className="font-semibold">{formatJumlahKg(totalInput)} kg</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Hasil:</span>
                        <div className={`font-semibold ${isExceeded ? "text-destructive" : ""}`}>
                          {formatJumlahKg(totalHasil)} kg
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sisa:</span>
                        <div className={`font-semibold ${sisa < 0 ? "text-destructive" : ""}`}>
                          {formatJumlahKg(sisa)} kg
                        </div>
                      </div>
                    </div>
                    {isExceeded && (
                      <div className="text-sm text-destructive mt-2">
                        ⚠️ Total hasil melebihi jumlah input
                      </div>
                    )}
                  </div>
                );
              }}
            </form.Subscribe>
          </div>

          {/* Error Display */}
          {form.state.errors.length > 0 && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <div className="text-sm font-semibold text-destructive mb-2">
                Terdapat kesalahan:
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                {form.state.errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}
          </div>

          <DialogFooter className="shrink-0 border-t mb-1 px-6 py-4 bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Mengonfirmasi..." : "Konfirmasi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>
  );
}
