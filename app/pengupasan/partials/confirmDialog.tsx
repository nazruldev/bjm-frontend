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
import { Calendar as CalendarIcon } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { JumlahKgInput } from "@/components/ui/jumlah-kg-input";
import {
  formatJumlah,
  parseJumlah,
  parseNumberID,
  formatCurrency,
  parseCurrency,
  formatDecimal,
  formatJumlahKg,
  getTodayDateString,
  toLocalDateTimeISO,
} from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirmPassword } from "@/components/dialog-confirm-password";
import { useRekenings } from "@/hooks/useRekenings";
import type {
  ConfirmPengupasanDto,
  Pengupasan,
} from "@/services/pengupasanService";

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

// Schema dengan validasi dinamis berdasarkan pengupasan
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
      kemiriCangkangMode: z.enum(["otomatis", "manual"]),
      kemiri_cangkang_jumlah_manual: z.preprocess((val) => {
        if (val === "" || val === null || val === undefined) return null;
        if (typeof val === "string") {
          const parsed = parseNumberID(val);
          return isNaN(parsed) ? null : parsed;
        }
        return typeof val === "number" ? val : null;
      }, z.number().min(0, "Jumlah kemiri cangkang manual harus >= 0").optional().nullable()),
      isCashless: z.boolean().default(false),
      rekeningId: z.string().optional().nullable(),
      pembayaran: z.preprocess((val) => {
        if (val === "" || val === null || val === undefined) return 0;
        if (typeof val === "string") {
          const parsed = parseFloat(parseCurrency(val));
          return isNaN(parsed) ? 0 : parsed;
        }
        return typeof val === "number" ? val : 0;
      }, z.number().min(0, "Pembayaran harus >= 0")),
      kemiri_campur_jumlah: z.preprocess(
        (val) => {
          if (val === "" || val === null || val === undefined) return null;
          if (typeof val === "string") {
            const parsed = parseNumberID(val);
            return isNaN(parsed) ? null : parsed;
          }
          return typeof val === "number" ? val : null;
        },
        z
          .union([z.number(), z.null()])
          .refine((val) => val !== null, {
            message: "Jumlah kemiri campur wajib diisi",
          })
          .refine((val) => val !== null && val > 0, {
            message: "Jumlah kemiri campur wajib diisi dan harus positif",
          })
          .transform((val) => val as number)
      ),
    })
    .superRefine((data, ctx) => {
      // Validasi: tanggal selesai tidak boleh lebih kecil dari tanggal mulai
      if (data.tanggal_selesai) {
        const tanggalSelesai =
          data.tanggal_selesai instanceof Date
            ? data.tanggal_selesai
            : new Date(data.tanggal_selesai);
        const tanggalMulaiDate =
          tanggalMulai instanceof Date ? tanggalMulai : new Date(tanggalMulai);

        // Reset waktu ke 00:00:00 untuk perbandingan tanggal saja
        const selesaiDateOnly = new Date(
          tanggalSelesai.getFullYear(),
          tanggalSelesai.getMonth(),
          tanggalSelesai.getDate()
        );
        const mulaiDateOnly = new Date(
          tanggalMulaiDate.getFullYear(),
          tanggalMulaiDate.getMonth(),
          tanggalMulaiDate.getDate()
        );

        if (selesaiDateOnly < mulaiDateOnly) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Tanggal selesai tidak boleh lebih kecil dari tanggal mulai",
            path: ["tanggal_selesai"],
          });
        }
      }
      // Validasi: jika mode manual cangkang, kemiri_cangkang_jumlah_manual wajib diisi
      if (data.kemiriCangkangMode === "manual") {
        if (
          data.kemiri_cangkang_jumlah_manual === null ||
          data.kemiri_cangkang_jumlah_manual === undefined
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Jumlah kemiri cangkang manual wajib diisi jika mode manual",
            path: ["kemiri_cangkang_jumlah_manual"],
          });
        } else if (data.kemiri_cangkang_jumlah_manual > totalInput) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Jumlah kemiri cangkang (${data.kemiri_cangkang_jumlah_manual.toFixed(
              2
            )} kg) tidak boleh melebihi total input (${totalInput.toFixed(
              2
            )} kg)`,
            path: ["kemiri_cangkang_jumlah_manual"],
          });
        } else {
          const kemiriCampur =
            typeof data.kemiri_campur_jumlah === "number"
              ? data.kemiri_campur_jumlah
              : parseNumberID(String(data.kemiri_campur_jumlah ?? "")) || 0;
          const maxCangkang = Math.max(0, totalInput - kemiriCampur);
          if (data.kemiri_cangkang_jumlah_manual > maxCangkang) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Jumlah kemiri cangkang tidak boleh melebihi sisa (maks. ${maxCangkang.toFixed(2)} kg)`,
              path: ["kemiri_cangkang_jumlah_manual"],
            });
          }
        }
      }
      // Validasi: jika isCashless = true, rekeningId wajib diisi
      if (
        data.isCashless &&
        (!data.rekeningId || data.rekeningId.trim() === "")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rekening sumber wajib diisi jika pembayaran non-tunai",
          path: ["rekeningId"],
        });
      }
      // Validasi: kemiri campur tidak boleh melebihi total input
      if (data.kemiri_campur_jumlah != null && data.kemiri_campur_jumlah > totalInput) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Jumlah kemiri campur (${data.kemiri_campur_jumlah.toFixed(
            2
          )} kg) tidak boleh melebihi total input (${totalInput.toFixed(
            2
          )} kg)`,
          path: ["kemiri_campur_jumlah"],
        });
      }
    });

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pengupasan: Pengupasan | null;
  onSubmit: (data: ConfirmPengupasanDto) => Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  pengupasan,
  onSubmit,
}: ConfirmDialogProps) {
  const { openConfirmPassword } = useConfirmPassword();
  const pendingPayloadRef = React.useRef<ConfirmPengupasanDto | null>(null);

  if (!pengupasan) return null;
  // Fetch rekening options untuk cashless payment
  const { data: rekeningsData } = useRekenings({
    limit: 1000,
    isActive: true,
  });

  const rekeningOptions = React.useMemo(() => {
    if (!rekeningsData?.data) return [];
    return rekeningsData.data.map((rekening) => ({
      value: rekening.id,
      label: `${rekening.bank} - ${rekening.nama}`,
    }));
  }, [rekeningsData]);

  // Calculate total input
  const totalInput = React.useMemo(() => {
    if (!pengupasan) return 0;
    return Number(pengupasan.produkJumlah) || 0;
  }, [pengupasan]);

  const tanggalMulai =
    typeof pengupasan.tanggal_mulai === "string"
      ? pengupasan.tanggal_mulai.split("T")[0]
      : todayString();

  // Convert tanggalMulai to Date for defaultMonth
  const tanggalMulaiDate = React.useMemo(() => {
    return toDate(tanggalMulai);
  }, [tanggalMulai]);

  // Create dynamic schema based on totalInput and tanggalMulai
  const confirmSchemaMemo = React.useMemo(
    () => createConfirmSchema(totalInput, new Date(tanggalMulai)),
    [totalInput, tanggalMulai]
  );

  // Track apakah user sudah edit pembayaran secara manual
  const [isPembayaranEdited, setIsPembayaranEdited] = React.useState(false);

  const form = useForm({
    defaultValues: {
      tanggal_selesai: undefined as Date | undefined,
      kemiriCangkangMode: "otomatis" as "otomatis" | "manual",
      kemiri_cangkang_jumlah_manual: "" as string | number,
      isCashless: false,
      pembayaran: "" as string | number,
      kemiri_campur_jumlah: "" as string | number,
    } as any,
    validators: {
      onSubmit: confirmSchemaMemo as any,
    },
    onSubmit: async ({ value }) => {
      try {
        // Parse pembayaran
        let pembayaranValue: number;
        if (typeof value.pembayaran === "string") {
          const parsed = parseFloat(parseCurrency(value.pembayaran));
          pembayaranValue = isNaN(parsed) ? 0 : parsed;
        } else {
          pembayaranValue = value.pembayaran || 0;
        }

        // Jika mode manual cangkang: kemiri_campur_jumlah = totalInput - cangkang_manual
        let kemiriCangkangJumlahManual: number | null = null;
        if (value.kemiriCangkangMode === "manual") {
          if (typeof value.kemiri_cangkang_jumlah_manual === "string") {
            kemiriCangkangJumlahManual = parseNumberID(value.kemiri_cangkang_jumlah_manual) || null;
          } else {
            kemiriCangkangJumlahManual = value.kemiri_cangkang_jumlah_manual ?? null;
          }
        }

        // Parse kemiri_campur_jumlah (id-ID format dari JumlahKgInput)
        let kemiriCampurJumlahValue: number =
          typeof value.kemiri_campur_jumlah === "string"
            ? parseNumberID(value.kemiri_campur_jumlah)
            : (value.kemiri_campur_jumlah ?? 0);

        const payload: ConfirmPengupasanDto = {
          tanggal_selesai: value.tanggal_selesai
            ? value.tanggal_selesai instanceof Date
              ? toLocalDateTimeISO(value.tanggal_selesai)
              : value.tanggal_selesai
            : toLocalDateTimeISO(new Date()),
          kemiriCampurMode: "otomatis",
          kemiri_campur_jumlah_manual: null,
          isCashless: value.isCashless || false,
          rekeningId:
            value.isCashless && value.rekeningId ? value.rekeningId : null,
          pembayaran: pembayaranValue,
          kemiri_campur_jumlah: kemiriCampurJumlahValue,
        };

        pendingPayloadRef.current = payload;
        openConfirmPassword({
          title: "Konfirmasi password",
          description: "Masukkan password Anda untuk melanjutkan konfirmasi pengupasan.",
          onConfirm: handleConfirmAfterPassword,
        });
        return;
      } catch (error: any) {
        if (!error.errors) {
          toast.error(
            error?.message || "Terjadi kesalahan saat mengonfirmasi pengupasan"
          );
        }
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
      if (!err?.errors) {
        toast.error(err?.message || "Gagal mengonfirmasi pengupasan");
      }
    }
  }, [onSubmit, form, onOpenChange]);

  React.useEffect(() => {
    if (open && pengupasan) {
      setIsPembayaranEdited(false);
      form.reset({
        tanggal_selesai: undefined,
        kemiriCangkangMode: "otomatis",
        kemiri_cangkang_jumlah_manual: "",
        isCashless: false,
        pembayaran: "",
        kemiri_campur_jumlah: "",
      } as any);
    }
  }, [open, pengupasan, form]);

  // Auto-update pembayaran ketika kemiri campur berubah (jika belum di-edit manual)
  React.useEffect(() => {
    if (!open || !pengupasan || isPembayaranEdited) return;

    const formValues = form.state.values;
    const upahSatuan = Number(pengupasan?.upah_satuan) || 0;
    let kemiriCampur: number = 0;

    if (formValues.kemiri_campur_jumlah) {
      kemiriCampur =
        typeof formValues.kemiri_campur_jumlah === "string"
          ? parseNumberID(formValues.kemiri_campur_jumlah)
          : formValues.kemiri_campur_jumlah || 0;
    }

    if (kemiriCampur > 0) {
      const totalUpah = kemiriCampur * upahSatuan;
      // Update pembayaran ke total upah jika belum di-edit
      form.setFieldValue("pembayaran", totalUpah.toString());
    }
  }, [
    form.state.values.kemiri_campur_jumlah,
    open,
    pengupasan,
    isPembayaranEdited,
    form,
  ]);

  if (!pengupasan) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 ">
            <DialogTitle>Konfirmasi Pengupasan</DialogTitle>
            <DialogDescription>
              Masukkan hasil kemiri campur dan tanggal selesai. Kemiri cangkang akan dihitung otomatis.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4">
              {/* Tanggal Mulai & Tanggal Selesai - Grid 2 kolom */}
              <div className="grid grid-cols-2 gap-4">
                {/* Tanggal Mulai - Readonly */}
                <Field>
                  <FieldLabel>Tanggal Mulai</FieldLabel>
                  <div className="rounded-lg border p-1.5 bg-muted/50">
                    <div className="text-sm font-medium">
                      {dayjs(tanggalMulai).format("DD MMM YYYY")}
                    </div>
                  </div>
                </Field>

                {/* Tanggal Selesai - Form Field */}
                <form.Field name="tanggal_selesai">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <DatePickerField
                          field={field}
                          label="Tanggal Selesai *"
                          placeholder="Pilih tanggal selesai"
                          minDateString={tanggalMulai}
                          defaultMonth={tanggalMulaiDate}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              </div>
              <div className="grid grid-cols-2 gap-2 ">
                <Field>
                  <FieldLabel>Input Produk</FieldLabel>
                  <div className="rounded-lg border p-1.5 bg-muted/50">
                    <div className="flex items-center justify-between text-sm">
                      <span>Kemiri Kering</span>
                      <span className="font-medium">
                        {Number(pengupasan.produkJumlah).toLocaleString("id-ID")}{" "}
                        kg
                      </span>
                    </div>
                  </div>
                </Field>
                {/* Output Jumlah - Kemiri Campur */}
                <form.Field name="kemiri_campur_jumlah">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    const totalInput = Number(pengupasan?.produkJumlah) || 0;
                    const rawStr = (field.state.value as string) ?? "";

                    const handleKemiriCampurChange = (value: string) => {
                      if (value === "") {
                        field.handleChange("");
                        if (!isPembayaranEdited) form.setFieldValue("pembayaran", "");
                        return;
                      }
                      const parsed = parseNumberID(value);
                      let finalValue = value;
                      if (!isNaN(parsed) && parsed > totalInput && totalInput >= 0) {
                        finalValue =
                          totalInput > 0
                            ? totalInput.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 3 })
                            : "0";
                      }
                      field.handleChange(finalValue);
                      if (!isPembayaranEdited) {
                        const currentValue = parseNumberID(finalValue);
                        if (currentValue > 0) {
                          const upahSatuan = Number(pengupasan?.upah_satuan) || 0;
                          form.setFieldValue("pembayaran", (currentValue * upahSatuan).toString());
                        } else {
                          form.setFieldValue("pembayaran", "");
                        }
                      }
                    };

                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Jumlah Kemiri Campur *
                        </FieldLabel>
                        <JumlahKgInput
                          id={field.name}
                          value={rawStr}
                          onChange={handleKemiriCampurChange}
                          onBlur={() => field.handleBlur()}
                          satuan="kg"
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              </div>
              {/* Kemiri Campur Mode */}
              <div className="grid grid-cols-2 gap-2 ">
                <form.Field name="kemiriCangkangMode">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel>Mode Kemiri Cangkang *</FieldLabel>
                        <Select
                          value={field.state.value || "otomatis"}
                          onValueChange={(value) => {
                            field.handleChange(value as "otomatis" | "manual");
                            field.handleBlur();
                            setIsPembayaranEdited(false);
                          }}
                        >
                          <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                            <SelectValue placeholder="Pilih mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="otomatis">Otomatis</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>

                {/* Kemiri Cangkang Manual (hanya muncul jika mode manual) */}
                <form.Subscribe
                  selector={(state) => ({
                    kemiriCangkangMode: state.values.kemiriCangkangMode,
                    kemiri_campur_jumlah: state.values.kemiri_campur_jumlah,
                  })}
                  // eslint-disable-next-line react/no-children-prop
                  children={({ kemiriCangkangMode, kemiri_campur_jumlah }) => {
                    const totalInput = Number(pengupasan?.produkJumlah) || 0;
                    const kemiriCampur =
                      typeof kemiri_campur_jumlah === "string"
                        ? parseNumberID(kemiri_campur_jumlah)
                        : Number(kemiri_campur_jumlah) || 0;
                    const maxCangkang = Math.max(0, totalInput - kemiriCampur);

                    return (
                      <form.Field name="kemiri_cangkang_jumlah_manual">
                        {(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          const rawStr = (field.state.value as string) ?? "";

                          const handleManualChange = (value: string) => {
                            const parsed = parseNumberID(value);
                            let finalValue = value;
                            if (!isNaN(parsed) && parsed > maxCangkang) {
                              finalValue =
                                maxCangkang > 0
                                  ? maxCangkang.toLocaleString("id-ID", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 3,
                                  })
                                  : "";
                            }
                            field.handleChange(finalValue);
                            if (!isPembayaranEdited) {
                              const campurRaw = form.state.values.kemiri_campur_jumlah;
                              const campur =
                                typeof campurRaw === "string"
                                  ? parseNumberID(campurRaw)
                                  : Number(campurRaw) || 0;
                              if (campur > 0) {
                                const upahSatuan = Number(pengupasan?.upah_satuan) || 0;
                                form.setFieldValue("pembayaran", (campur * upahSatuan).toString());
                              }
                            }
                          };

                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel>Kemiri Cangkang Manual (kg) *</FieldLabel>

                              <JumlahKgInput
                                disabled={kemiriCangkangMode !== "manual"}
                                id={field.name}
                                value={rawStr}
                                onChange={handleManualChange}
                                onBlur={() => field.handleBlur()}
                                satuan="kg"
                                aria-invalid={isInvalid}
                              />
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </Field>
                          );
                        }}
                      </form.Field>
                    );
                  }}
                />

                <div className="col-span-2">
                  <form.Subscribe
                    selector={(state) => ({
                      kemiriCangkangMode: state.values.kemiriCangkangMode,
                      kemiri_cangkang_jumlah_manual: state.values.kemiri_cangkang_jumlah_manual,
                      kemiri_campur_jumlah: state.values.kemiri_campur_jumlah,
                    })}
                    children={(formValues: any) => {
                      const totalInput = Number(pengupasan?.produkJumlah) || 0;
                      let kemiriCampur: number;
                      let kemiriCangkang: number;

                      if (
                        formValues.kemiriCangkangMode === "manual" &&
                        (formValues.kemiri_cangkang_jumlah_manual !== "" &&
                          formValues.kemiri_cangkang_jumlah_manual != null)
                      ) {
                        kemiriCampur =
                          typeof formValues.kemiri_campur_jumlah === "string"
                            ? parseNumberID(formValues.kemiri_campur_jumlah)
                            : formValues.kemiri_campur_jumlah || 0;
                        kemiriCangkang =
                          typeof formValues.kemiri_cangkang_jumlah_manual === "string"
                            ? parseNumberID(formValues.kemiri_cangkang_jumlah_manual)
                            : formValues.kemiri_cangkang_jumlah_manual || 0;
                      } else {
                        kemiriCampur =
                          typeof formValues.kemiri_campur_jumlah === "string"
                            ? parseNumberID(formValues.kemiri_campur_jumlah)
                            : formValues.kemiri_campur_jumlah || 0;
                        kemiriCangkang = totalInput - kemiriCampur;
                      }

                      const isValid = kemiriCampur <= totalInput && kemiriCangkang >= 0;

                      return (
                        <Field>
                          <div
                            className={`rounded-lg border p-4 ${isValid
                                ? "bg-muted/50"
                                : "bg-destructive/10 border-destructive"
                              }`}
                          >
                            {!isValid && (
                              <div className="mb-2 text-sm text-destructive font-medium">
                                ⚠️ Jumlah kemiri campur ({formatJumlahKg(kemiriCampur)} kg)
                                melebihi input ({formatJumlahKg(totalInput)} kg)
                              </div>
                            )}
                            <div className="flex flex-row gap-10">
                              <div>
                                <div className="text-sm text-muted-foreground">
                                  Kemiri Campur
                                </div>
                                <div className="text-lg font-semibold">
                                  {formatJumlahKg(kemiriCampur)} kg
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">
                                  Kemiri Cangkang
                                </div>
                                <div
                                  className={`text-lg font-semibold ${kemiriCangkang < 0 ? "text-destructive" : ""
                                    }`}
                                >
                                  {kemiriCangkang >= 0
                                    ? `${formatJumlahKg(kemiriCangkang)} kg`
                                    : `-${formatJumlahKg(Math.abs(kemiriCangkang))} kg`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Field>
                      );
                    }}
                  />
                </div>
              </div>

              {/* Display Total Upah - Reactive berdasarkan kemiri campur */}
              <form.Subscribe
                selector={(state) => ({
                  kemiriCangkangMode: state.values.kemiriCangkangMode,
                  kemiri_cangkang_jumlah_manual: state.values.kemiri_cangkang_jumlah_manual,
                  kemiri_campur_jumlah: state.values.kemiri_campur_jumlah,
                })}
                children={(formValues: any) => {
                  const upahSatuan = Number(pengupasan?.upah_satuan) || 0;
                  let kemiriCampur: number;

                  kemiriCampur =
                    typeof formValues.kemiri_campur_jumlah === "string"
                      ? parseNumberID(formValues.kemiri_campur_jumlah)
                      : formValues.kemiri_campur_jumlah || 0;

                  const totalUpah = kemiriCampur * upahSatuan;

                  return (
                    <Field>
                      <FieldLabel>Total Upah</FieldLabel>
                      <div className="rounded-lg border p-1.5 bg-muted/50">
                        <div className="flex items-center justify-between text-sm">
                          <span>Kemiri Campur: {formatJumlahKg(kemiriCampur)} kg × {formatCurrency(upahSatuan)}</span>
                          <span className="font-medium">
                            {formatCurrency(totalUpah)}
                          </span>
                        </div>
                      </div>
                    </Field>
                  );
                }}
              />

              {/* Grid untuk Pembayaran */}
              <div className="max-w-sm">
                <div className="flex flex-col gap-2 items-center">
                  {/* Is Cashless */}
                  <form.Field name="isCashless">
                    {(field) => {
                      return (
                        <Field>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={field.name}
                              checked={field.state.value || false}
                              onCheckedChange={(checked) => {
                                field.handleChange(checked as boolean);
                                // Reset rekeningId ke null dan clear error jika isCashless false
                                if (!checked) {
                                  form.setFieldValue("rekeningId", null);
                                  // Clear error untuk rekeningId
                                  form.setFieldMeta("rekeningId", (prev) => ({
                                    ...prev,
                                    errors: [],
                                    errorMap: {},
                                  }));
                                }
                                field.handleBlur();
                              }}
                              onBlur={field.handleBlur}
                            />
                            <FieldLabel
                              htmlFor={field.name}
                              className="cursor-pointer"
                            >
                              Cashless ( Pembayaran Non Tunai )
                            </FieldLabel>
                          </div>
                        </Field>
                      );
                    }}
                  </form.Field>

                  {/* Rekening Sumber (hanya muncul jika isCashless = true) */}
                  <form.Subscribe
                    selector={(state) => ({
                      isCashless: state.values?.isCashless || false,
                    })}
                    children={(state) => {
                      const isCashless = state.isCashless;

                      return (
                        <form.Field name="rekeningId">
                          {(field) => {
                            const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                            return (
                              <Field data-invalid={isInvalid}>
                                <FieldLabel>Rekening Sumber *</FieldLabel>
                                <Select
                                  disabled={!isCashless}
                                  value={field.state.value || ""}
                                  onValueChange={(value) => {
                                    field.handleChange(value);
                                    field.handleBlur();
                                  }}
                                >
                                  <SelectTrigger
                                    id={field.name}
                                    aria-invalid={isInvalid}
                                  >
                                    <SelectValue placeholder="Pilih rekening" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {rekeningOptions.map(
                                      (option: {
                                        value: string;
                                        label: string;
                                      }) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                                {isInvalid && (
                                  <FieldError errors={field.state.meta.errors} />
                                )}
                              </Field>
                            );
                          }}
                        </form.Field>
                      );
                    }}
                  />
                </div>
              </div>

              {/* Pembayaran */}
              <form.Subscribe
                selector={(state) => ({
                  kemiriCangkangMode: state.values.kemiriCangkangMode,
                  kemiri_cangkang_jumlah_manual: state.values.kemiri_cangkang_jumlah_manual,
                  kemiri_campur_jumlah: state.values.kemiri_campur_jumlah,
                  pembayaran: state.values.pembayaran,
                })}
                children={(formValues: any) => {
                  const upahSatuan = Number(pengupasan?.upah_satuan) || 0;
                  let kemiriCampur: number;

                  kemiriCampur =
                    typeof formValues.kemiri_campur_jumlah === "string"
                      ? parseNumberID(formValues.kemiri_campur_jumlah)
                      : formValues.kemiri_campur_jumlah || 0;

                  const totalUpah = kemiriCampur * upahSatuan;

                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <Field>
                        <FieldLabel>Total upah</FieldLabel>
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="0"
                            value={formatCurrency(totalUpah)}
                            disabled
                            className="pl-10"
                            autoComplete="off"
                            inputMode="numeric"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                            Rp
                          </span>
                        </div>
                      </Field>
                      <form.Field name="pembayaran">
                        {(field) => {
                          const isInvalid =
                            field.state.meta.isTouched && !field.state.meta.isValid;
                          const pembayaranValue =
                            typeof field.state.value === "string"
                              ? parseFloat(parseCurrency(field.state.value)) || 0
                              : field.state.value || 0;
                          const sisaHutang = totalUpah - pembayaranValue;
                          const isOverPayment = pembayaranValue > totalUpah;

                          return (
                            <Field data-invalid={isInvalid || isOverPayment}>
                              <FieldLabel>Pembayaran *</FieldLabel>
                              <div className="relative">
                                <Input
                                  id={field.name}
                                  type="text"
                                  placeholder="0"
                                  value={formatCurrency(field.state.value || "")}
                                  onBlur={(e) => {
                                    const rawValue = parseCurrency(e.target.value);
                                    field.handleChange(rawValue);
                                    field.handleBlur();
                                  }}
                                  onChange={(e) => {
                                    const rawValue = parseCurrency(e.target.value);

                                    // Validasi: tidak boleh melebihi totalUpah
                                    const parsedValue = parseFloat(rawValue);
                                    let finalValue = rawValue;
                                    if (
                                      !isNaN(parsedValue) &&
                                      parsedValue > totalUpah &&
                                      rawValue !== ""
                                    ) {
                                      finalValue =
                                        totalUpah > 0
                                          ? String(Math.floor(totalUpah))
                                          : "0";
                                    }

                                    field.handleChange(finalValue);
                                    // Mark bahwa pembayaran sudah di-edit manual
                                    setIsPembayaranEdited(true);
                                  }}
                                  className="pl-10"
                                  autoComplete="off"
                                  inputMode="numeric"
                                  aria-invalid={isInvalid || isOverPayment}
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                                  Rp
                                </span>
                              </div>
                              {isOverPayment && (
                                <div className="text-sm text-destructive mt-1">
                                  Pembayaran tidak boleh melebihi total upah (
                                  {formatCurrency(totalUpah)})
                                </div>
                              )}
                              {isInvalid && !isOverPayment && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                              {sisaHutang > 0 && !isOverPayment && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  Perusahaan Terhutang :{" "}
                                  <span className="font-semibold text-destructive">
                                    {formatCurrency(sisaHutang)}
                                  </span>
                                </div>
                              )}
                              {sisaHutang === 0 && !isOverPayment && pembayaranValue > 0 && (
                                <div className="text-sm text-green-600 mt-1">
                                  ✓ Pembayaran lunas
                                </div>
                              )}
                            </Field>
                          );
                        }}
                      </form.Field>
                    </div>
                  );
                }}
              />
            </div>

            <div className="flex justify-end gap-2  px-6 pb-6 pt-4 border-t shrink-0">
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
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
