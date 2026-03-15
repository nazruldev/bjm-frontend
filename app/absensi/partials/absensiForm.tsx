"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";
import type { CreateAbsensiDto, Absensi } from "@/services/absensiService";
import { absensiService } from "@/services/absensiService";
import { useCurrentOutlet } from "@/hooks/useOutlets";

interface AbsensiFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Absensi;
  karyawanOptions: { value: string; label: string }[];
  onSubmit: (data: CreateAbsensiDto) => Promise<void>;
}

const absensiSchema = z
  .object({
    mode: z.enum(["create", "edit"]).default("create"),
    // Untuk edit (satu karyawan)
    karyawanId: z.string().optional(),
    // Untuk create multiple
    karyawanIds: z.array(z.string()).optional(),
    tanggal: z.date({ message: "Tanggal wajib diisi" }),
    jam_masuk: z
      .string()
      .min(1, "Jam masuk wajib diisi")
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Format jam tidak valid (HH:MM)"
      ),
    jam_keluar: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) =>
          !val ||
          val === "" ||
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val),
        { message: "Format jam tidak valid (HH:MM)" }
      ),
    catatan: z.string().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.mode === "edit") {
      if (!val.karyawanId || val.karyawanId.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Karyawan wajib dipilih",
          path: ["karyawanId"],
        });
      }
    } else {
      if (!val.karyawanIds || val.karyawanIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Minimal satu karyawan harus dipilih",
          path: ["karyawanIds"],
        });
      }
    }
    // Jam masuk tidak boleh lebih besar dari jam keluar
    const jamMasuk = (val.jam_masuk || "").trim();
    const jamKeluar = (val.jam_keluar || "").trim();
    if (jamMasuk && jamKeluar && /^\d{1,2}:\d{2}$/.test(jamMasuk) && /^\d{1,2}:\d{2}$/.test(jamKeluar)) {
      const [hM, mM] = jamMasuk.split(":").map(Number);
      const [hK, mK] = jamKeluar.split(":").map(Number);
      const menitMasuk = hM * 60 + mM;
      const menitKeluar = hK * 60 + mK;
      if (menitMasuk > menitKeluar) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Jam masuk tidak boleh lebih besar dari jam keluar",
          path: ["jam_keluar"],
        });
      }
    }
  });

export function AbsensiForm({
  open,
  onOpenChange,
  initialData,
  karyawanOptions,
  onSubmit,
}: AbsensiFormProps) {
  const isEdit = !!initialData;
  const { data: currentOutlet } = useCurrentOutlet(undefined, { enabled: open });
  const batasCheckinStart = currentOutlet?.data?.batasJamCheckinStart ?? "00:00";
  const batasCheckinEnd = currentOutlet?.data?.batasJamCheckinEnd ?? "08:00";
  const batasCheckoutStart = currentOutlet?.data?.batasJamCheckoutStart ?? "17:00";
  const batasCheckoutEnd = currentOutlet?.data?.batasJamCheckoutEnd ?? "23:59";

  const form = useForm({
    defaultValues: {
      mode: isEdit ? "edit" : "create",
      karyawanId: initialData?.karyawanId || "",
      karyawanIds: [] as string[],
      tanggal: initialData?.tanggal
        ? typeof initialData.tanggal === "string"
          ? new Date(initialData.tanggal)
          : initialData.tanggal
        : new Date(),
      jam_masuk: initialData?.jam_masuk || "",
      jam_keluar: initialData?.jam_keluar || "",
      catatan: initialData?.catatan || "",
    } as any,
    validators: {
      onSubmit: absensiSchema as any,
    },
    onSubmit: async ({ value }) => {
      try {
        // Parse tanggal
        const tanggal_sekarang = dayjs().format("YYYY-MM-DD");


        if (value.mode === "edit") {
          const payload: CreateAbsensiDto = {
            karyawanId: value.karyawanId || initialData?.karyawanId || "",
            tanggal: tanggal_sekarang,
            jam_masuk: value.jam_masuk,
            jam_keluar: value.jam_keluar?.trim() || null,
            catatan: value.catatan || null,
          };
          await onSubmit(payload);
        } else {
          const ids = ((value.karyawanIds || []) as string[]).filter(
            (id) => !karyawanIdsSudahAbsen.has(id)
          );
          if (ids.length === 0) {
            toast.error("Semua karyawan yang dipilih sudah memiliki absensi di tanggal ini.");
            return;
          }
          for (const karyawanId of ids) {
            const payload: CreateAbsensiDto = {
              karyawanId,
              tanggal: tanggal_sekarang,
              jam_masuk: value.jam_masuk,
              jam_keluar: value.jam_keluar?.trim() || null,
              catatan: value.catatan || null,
            };
            await onSubmit(payload);
          }
        }

        form.reset();
        onOpenChange(false);
      } catch (error) {
        toast.error("Terjadi kesalahan saat menyimpan data");
      }
    },
  });

  // Tanggal untuk create: set saat form dibuka agar query "sudah absen" langsung jalan dengan tanggal yang benar
  const [createForDateStr, setCreateForDateStr] = React.useState("");
  React.useEffect(() => {
    if (open && !initialData) {
      setCreateForDateStr(dayjs().format("YYYY-MM-DD"));
    } else if (!open) {
      setCreateForDateStr("");
    }
  }, [open, initialData]);

  const tanggal = form.state.values.tanggal as Date | undefined;
  const tanggalStr =
    createForDateStr ||
    (tanggal
      ? dayjs(tanggal instanceof Date ? tanggal : new Date(tanggal)).format("YYYY-MM-DD")
      : "");

  const queryClient = useQueryClient();
  const {
    data: absensiForDate,
    isSuccess: isAbsensiForDateLoaded,
    isLoading: isAbsensiForDateLoading,
  } = useQuery({
    queryKey: ["absensi", "by-date", tanggalStr],
    queryFn: () =>
      absensiService.getAbsensis({
        tanggalFrom: tanggalStr,
        tanggalTo: tanggalStr,
        limit: 500,
        page: 1,
      }),
    enabled: open && !initialData && !!tanggalStr,
  });

  const prevOpenRef = React.useRef(false);
  React.useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (justOpened && !initialData && tanggalStr) {
      queryClient.invalidateQueries({ queryKey: ["absensi", "by-date", tanggalStr] });
    }
  }, [open, initialData, tanggalStr, queryClient]);
  const karyawanIdsSudahAbsen = React.useMemo(
    () => new Set((absensiForDate?.data ?? []).map((a) => a.karyawanId)),
    [absensiForDate?.data]
  );
  const canSubmitCreate = initialData !== undefined || isAbsensiForDateLoaded;

  // Hapus dari selected karyawan yang sudah absen di tanggal ini (harus di top level, bukan di dalam form.Field)
  const rawKaryawanIds = form.state.values.karyawanIds;
  const selectedKaryawanIds: string[] = Array.isArray(rawKaryawanIds) ? rawKaryawanIds : [];
  const selectedValidKaryawanIds = selectedKaryawanIds.filter((id) => !karyawanIdsSudahAbsen.has(id));
  React.useEffect(() => {
    if (!initialData && selectedValidKaryawanIds.length !== selectedKaryawanIds.length) {
      form.setFieldValue("karyawanIds", selectedValidKaryawanIds);
    }
  }, [tanggalStr, absensiForDate?.data]);

  React.useEffect(() => {
    if (open && initialData) {
      form.reset({
        mode: "edit",
        karyawanId: initialData.karyawanId,
        karyawanIds: [initialData.karyawanId],
        tanggal: initialData.tanggal
          ? typeof initialData.tanggal === "string"
            ? new Date(initialData.tanggal)
            : initialData.tanggal
          : new Date(),
        jam_masuk: initialData.jam_masuk || "",
        jam_keluar: initialData.jam_keluar || "",
        catatan: initialData.catatan || "",
      } as any);
    } else if (open && !initialData) {
      const todayStart = dayjs().startOf("day").toDate();
      form.reset({
        mode: "create",
        karyawanId: "",
        karyawanIds: [],
        tanggal: todayStart,
        jam_masuk: "",
        jam_keluar: "",
        catatan: "",
      } as any);
    }
  }, [open, initialData, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 max-h-screen">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>
            {initialData ? "Edit Absensi" : "Tambah Absensi"}
          </SheetTitle>
          <SheetDescription>
            {initialData
              ? "Ubah informasi absensi di bawah ini"
              : "Isi form di bawah ini untuk menambah absensi baru"}
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
            {/* Karyawan */}
            {initialData ? (
              // Edit mode: single karyawan, non-multiple
              <form.Field name="karyawanId">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Karyawan *</FieldLabel>
                    <Select
                      value={field.state.value || ""}
                      onValueChange={(value) => field.handleChange(value)}
                      disabled
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Pilih karyawan" />
                      </SelectTrigger>
                      <SelectContent>
                        {karyawanOptions.map((option) => (
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
            ) : (
              // Create mode: multiple karyawan (checkbox list + pilih semua). Karyawan yang sudah absen di tanggal terpilih di-disable.
              <form.Field name="karyawanIds">
                {(field) => {
                  const raw = field.state.value;
                  const selected: string[] = Array.isArray(raw) ? raw : [];
                  const allIds = karyawanOptions.map((o) => o.value);
                  const idsYangBisaDipilih = allIds.filter((id) => !karyawanIdsSudahAbsen.has(id));
                  const selectedValid = selected.filter((id) => !karyawanIdsSudahAbsen.has(id));
                  const allChecked =
                    idsYangBisaDipilih.length > 0 &&
                    idsYangBisaDipilih.every((id) => selectedValid.includes(id));
                  const isIndeterminate =
                    selectedValid.length > 0 && !allChecked;

                  const toggleAll = (checked: boolean) => {
                    if (checked) {
                      field.handleChange([...idsYangBisaDipilih]);
                    } else {
                      field.handleChange([]);
                    }
                  };

                  const toggleOne = (id: string, checked: boolean) => {
                    if (karyawanIdsSudahAbsen.has(id)) return;
                    if (checked) {
                      field.handleChange([...selected, id]);
                    } else {
                      field.handleChange(
                        selected.filter((item) => item !== id)
                      );
                    }
                  };

                  return (
                    <Field>
                      <FieldLabel>Karyawan *</FieldLabel>
                      {isAbsensiForDateLoading && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Memuat daftar karyawan yang sudah absen di tanggal ini...
                        </p>
                      )}
                      <div className="space-y-2 border rounded-md p-3 max-h-64 overflow-y-auto">
                        <div className="flex items-center gap-2 border-b pb-2 mb-2">
                          <Checkbox
                            checked={allChecked ? true : isIndeterminate ? "indeterminate" : false}
                            onCheckedChange={(val) =>
                              toggleAll(val === true)
                            }
                            disabled={idsYangBisaDipilih.length === 0}
                          />
                          <span className="text-sm font-medium">
                            Pilih semua
                          </span>
                          {karyawanIdsSudahAbsen.size > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({karyawanIdsSudahAbsen.size} sudah absen di tanggal ini)
                            </span>
                          )}
                        </div>
                        {karyawanOptions.map((option) => {
                          const sudahAbsen = karyawanIdsSudahAbsen.has(option.value);
                          return (
                            <label
                              key={option.value}
                              className={`flex items-center gap-2 py-1.5 rounded px-1 ${sudahAbsen
                                  ? "cursor-not-allowed opacity-60 pointer-events-none bg-muted/50"
                                  : "cursor-pointer hover:bg-muted/30"
                                }`}
                              onClick={(e) => sudahAbsen && e.preventDefault()}
                            >
                              <Checkbox
                                checked={selected.includes(option.value)}
                                onCheckedChange={(val) =>
                                  toggleOne(option.value, val === true)
                                }
                                disabled={sudahAbsen}
                                aria-disabled={sudahAbsen}
                              />
                              <span className="text-sm">{option.label}</span>
                              {sudahAbsen && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  Sudah absen
                                </Badge>
                              )}
                            </label>
                          );
                        })}
                      </div>
                      {field.state.meta.isTouched &&
                        !field.state.meta.isValid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                    </Field>
                  );
                }}
              </form.Field>
            )}

            {!initialData && tanggalStr && (
              <p className="text-sm text-muted-foreground">
                Tanggal absensi: <strong>{dayjs(tanggalStr).format("DD/MM/YYYY")}</strong>
                {isAbsensiForDateLoading && " (memuat daftar yang sudah absen…)"}
              </p>
            )}

            {/* Info batas jam check-in & check-out outlet */}
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Aturan outlet</p>
              <p>
                Check-in:{" "}
                <strong className="font-mono">
                  {batasCheckinStart} - {batasCheckinEnd}
                </strong>{" "}
                · Check-out:{" "}
                <strong className="font-mono">
                  {batasCheckoutStart} - {batasCheckoutEnd}
                </strong>
              </p>
              <p className="mt-0.5 text-xs">
                Jam masuk dan jam keluar harus berada di dalam rentang di atas
                untuk mendapatkan status <strong>HADIR</strong>.
              </p>
            </div>

            {/* Jam Masuk — mask HH:mm (jam dan menit saja) */}
            <form.Field name="jam_masuk">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name} className="flex items-center gap-2">
                    <Clock className="size-4" />
                    Jam Masuk *
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="text"
                    inputMode="numeric"
                    placeholder="00:00"
                    maxLength={5}
                    value={field.state.value || ""}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      if (v.length <= 2) {
                        field.handleChange(v);
                      } else {
                        const h = v.slice(0, 2);
                        const m = v.slice(2, 4);
                        field.handleChange(`${h}:${m}`);
                      }
                    }}
                    onBlur={() => {
                      const v = (field.state.value || "").replace(/\D/g, "");
                      if (v.length === 1) field.handleChange(`0${v}:00`);
                      else if (v.length === 2) field.handleChange(`${v}:00`);
                      field.handleBlur();
                    }}
                    className="font-mono tabular-nums w-[5.5rem]"
                  />
                  {field.state.meta.isTouched && !field.state.meta.isValid && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </Field>
              )}
            </form.Field>

            {/* Jam Keluar — mask HH:mm (opsional) */}
            <form.Field name="jam_keluar">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name} className="flex items-center gap-2">
                    <Clock className="size-4" />
                    Jam Keluar - Opsional
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="text"
                    inputMode="numeric"
                    placeholder="00:00"
                    maxLength={5}
                    value={field.state.value || ""}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      if (v.length <= 2) {
                        field.handleChange(v);
                      } else {
                        const h = v.slice(0, 2);
                        const m = v.slice(2, 4);
                        field.handleChange(`${h}:${m}`);
                      }
                    }}
                    onBlur={() => {
                      const val = field.state.value || "";
                      if (val.trim() === "") {
                        field.handleBlur();
                        return;
                      }
                      const v = val.replace(/\D/g, "");
                      if (v.length === 1) field.handleChange(`0${v}:00`);
                      else if (v.length === 2) field.handleChange(`${v}:00`);
                      field.handleBlur();
                    }}
                    className="font-mono tabular-nums w-[5.5rem]"
                  />
                  {field.state.meta.isTouched && !field.state.meta.isValid && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </Field>
              )}
            </form.Field>

            {/* Catatan */}
            <form.Field name="catatan">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Catatan (Opsional)</FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.state.value || ""}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                    }}
                    onBlur={field.handleBlur}
                    placeholder="Masukkan catatan"
                    rows={3}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <SheetFooter className="px-6 pb-6 pt-4 border-t shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                form.state.isSubmitting ||
                (!initialData && !canSubmitCreate)
              }
            >
              {form.state.isSubmitting
                ? "Menyimpan..."
                : !initialData && isAbsensiForDateLoading
                  ? "Memuat..."
                  : "Simpan"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

