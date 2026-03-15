import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { Outlet, CreateOutletDto } from "@/services/outletService";
import { LogoUploadField } from "../partials/LogoUploadField";

/** Opsi access level untuk multiselect (dari Hik) */
export type AccessLevelOption = { value: string; label: string };

/**
 * Schema validasi untuk create/update outlet (sesuai Prisma schema)
 */
const timeField = z
  .string()
  .regex(/^\d{1,2}:\d{2}$/, "Format HH:mm (contoh: 08:00)");

export const createOutletSchema = z.object({
  nama: z.string().min(1, "Nama outlet wajib diisi"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  telepon: z
    .string()
    .min(1, "Nomor telepon wajib diisi")
    .regex(/^[0-9]+$/, "Nomor telepon harus berupa angka"),
  logo: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val ?? null)),
  defaultAccessLevelList: z.array(z.string()).optional(),
  batasJamCheckinStart: timeField.optional(),
  batasJamCheckinEnd: timeField.optional(),
  batasJamCheckoutStart: timeField.optional(),
  batasJamCheckoutEnd: timeField.optional(),
});

/**
 * Type untuk form data berdasarkan schema
 */
export type CreateOutletFormData = z.infer<typeof createOutletSchema>;

/**
 * Membuat form config untuk create/edit outlet.
 * Jika accessLevelOptions diberikan, field "Access Level (ACS)" ditambahkan untuk pilih level yang dipakai default di outlet ini.
 */
export const createFormConfig = (
  initialData?: Outlet,
  accessLevelOptions: AccessLevelOption[] = []
): FormConfig<CreateOutletDto> => {
  const baseFields: FormConfig<CreateOutletDto>["fields"] = [
    {
      name: "nama",
      label: "Nama Outlet",
      type: "text",
      placeholder: "Masukkan nama outlet",
      validation: z.string().min(1, "Nama outlet wajib diisi"),
      defaultValue: initialData?.nama || "",
    },
    {
      name: "alamat",
      label: "Alamat",
      type: "text",
      placeholder: "Masukkan alamat outlet",
      validation: z.string().min(1, "Alamat wajib diisi"),
      defaultValue: initialData?.alamat || "",
    },
    {
      name: "telepon",
      label: "No. Telepon",
      type: "phone",
      placeholder: "Masukkan nomor telepon",
      validation: z
        .string()
        .min(1, "Nomor telepon wajib diisi")
        .regex(/^[0-9]+$/, "Nomor telepon harus berupa angka"),
      defaultValue: initialData?.telepon || "",
    },
    {
      name: "logo",
      label: "Logo outlet (upload foto)",
      type: "text",
      placeholder: "Pilih file gambar",
      validation: z.string().optional().nullable(),
      defaultValue: initialData?.logo ?? "",
      customComponent: LogoUploadField,
    },
    {
      name: "batasJamCheckinStart",
      label: "Check-in Mulai",
      type: "time",
      placeholder: "00:00",
      validation: timeField,
      defaultValue: initialData?.batasJamCheckinStart ?? "00:00",
      gridCols: 2,
    },
    {
      name: "batasJamCheckinEnd",
      label: "Check-in Selesai",
      type: "time",
      placeholder: "08:00",
      validation: timeField,
      defaultValue: initialData?.batasJamCheckinEnd ?? "08:00",
      gridCols: 2,
    },
    {
      name: "batasJamCheckoutStart",
      label: "Check-out Mulai",
      type: "time",
      placeholder: "17:00",
      validation: timeField,
      defaultValue: initialData?.batasJamCheckoutStart ?? "17:00",
      gridCols: 2,
    },
    {
      name: "batasJamCheckoutEnd",
      label: "Check-out Selesai",
      type: "time",
      placeholder: "23:59",
      validation: timeField,
      defaultValue: initialData?.batasJamCheckoutEnd ?? "23:59",
      gridCols: 2,
    },
  ];

  const accessLevelField = {
    name: "defaultAccessLevelList",
    label: "Access Level (ACS) default outlet",
    type: "multiselect" as const,
    placeholder: accessLevelOptions.length === 0 ? "Memuat daftar..." : "Pilih access level (untuk karyawan di outlet ini)",
    description: "Daftar access level dari Hik. Saat buat/atur karyawan, bisa pakai list ini sebagai default.",
    options: accessLevelOptions,
    validation: z.array(z.string()).optional(),
    defaultValue: Array.isArray(initialData?.defaultAccessLevelList) ? initialData.defaultAccessLevelList : [],
  };

  const fields = [...baseFields, accessLevelField];

  return {
    title: initialData ? "Edit Outlet" : "Tambah Outlet",
    description: initialData
      ? "Ubah informasi outlet di bawah ini"
      : "Isi form di bawah ini untuk menambah outlet baru",
    fields,
    schema: createOutletSchema,
    defaultValues: {
      nama: initialData?.nama ?? "",
      alamat: initialData?.alamat ?? "",
      telepon: initialData?.telepon ?? "",
      logo: initialData?.logo ?? "",
      defaultAccessLevelList: Array.isArray(initialData?.defaultAccessLevelList) ? initialData.defaultAccessLevelList : [],
      batasJamCheckinStart: initialData?.batasJamCheckinStart ?? "00:00",
      batasJamCheckinEnd: initialData?.batasJamCheckinEnd ?? "08:00",
      batasJamCheckoutStart: initialData?.batasJamCheckoutStart ?? "17:00",
      batasJamCheckoutEnd: initialData?.batasJamCheckoutEnd ?? "23:59",
    } as CreateOutletDto,
    onSubmit: async () => { },
  };
};
