import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { Absensi, CreateAbsensiDto } from "@/services/absensiService";
import { getTodayDateString, toLocalDateStringOnly } from "@/lib/utils";

/**
 * Schema validasi untuk create/update absensi
 */
export const createAbsensiSchema = z.object({
  karyawanId: z.string().min(1, "Karyawan wajib dipilih"),
  tanggal: z.union([z.string(), z.date()]).refine(
    (val) => {
      if (!val) return false;
      const date = typeof val === "string" ? new Date(val) : val;
      return !isNaN(date.getTime());
    },
    { message: "Tanggal tidak valid" }
  ),
  jam_masuk: z.union([z.string(), z.date()]).refine(
    (val) => {
      if (!val) return false;
      const date = typeof val === "string" ? new Date(val) : val;
      return !isNaN(date.getTime());
    },
    { message: "Jam masuk tidak valid" }
  ),
  jam_keluar: z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val === "") return true; // Optional, boleh kosong
        const date = typeof val === "string" ? new Date(val) : val;
        return !isNaN(date.getTime());
      },
      { message: "Jam keluar tidak valid" }
    ),
  catatan: z.string().optional().nullable(),
});

/**
 * Type untuk form data berdasarkan schema
 */
export type CreateAbsensiFormData = z.infer<typeof createAbsensiSchema>;

/**
 * Membuat form config untuk create/edit absensi
 */
export const createFormConfig = (
  initialData?: Absensi,
  karyawanOptions: { value: string; label: string }[] = []
): FormConfig<CreateAbsensiDto> => {
  return {
    title: initialData ? "Edit Absensi" : "Tambah Absensi",
    description: initialData
      ? "Ubah informasi absensi di bawah ini"
      : "Isi form di bawah ini untuk menambah absensi baru",
    fields: [
      {
        name: "karyawanId",
        label: "Karyawan *",
        type: "select",
        placeholder: "Pilih karyawan",
        options: karyawanOptions,
        validation: z.string().min(1, "Karyawan wajib dipilih"),
        defaultValue: initialData?.karyawanId || "",
      },
      {
        name: "tanggal",
        label: "Tanggal *",
        type: "date",
        placeholder: "Pilih tanggal",
        validation: z.union([z.string(), z.date()]),
        defaultValue: initialData?.tanggal
          ? toLocalDateStringOnly(initialData.tanggal) || getTodayDateString()
          : getTodayDateString(),
      },
      {
        name: "jam_masuk",
        label: "Jam Masuk *",
        type: "text",
        placeholder: "HH:MM (contoh: 08:00)",
        validation: z.string().min(1, "Jam masuk wajib diisi"),
        defaultValue: initialData?.jam_masuk || ""},
      {
        name: "jam_keluar",
        label: "Jam Keluar (Opsional)",
        type: "text",
        placeholder: "HH:MM (contoh: 17:00)",
        validation: z.string().optional().nullable(),
          defaultValue: initialData?.jam_keluar || "",
      },
      {
        name: "catatan",
        label: "Catatan (Opsional)",
        type: "textarea",
        placeholder: "Masukkan catatan",
        validation: z.string().optional().nullable(),
        defaultValue: initialData?.catatan || "",
      },
    ],
    schema: createAbsensiSchema,
    defaultValues: {
      karyawanId: initialData?.karyawanId || "",
      tanggal: initialData?.tanggal
        ? toLocalDateStringOnly(initialData.tanggal) || getTodayDateString()
        : getTodayDateString(),
      jam_masuk: initialData?.jam_masuk || "",
      jam_keluar: initialData?.jam_keluar || "",
      catatan: initialData?.catatan || "",
    } as any,
    onSubmit: async () => {
      // Will be set by parent component
    },
  };
};

