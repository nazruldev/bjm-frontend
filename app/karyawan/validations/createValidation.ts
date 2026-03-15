import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { Karyawan, CreateKaryawanDto } from "@/services/karyawanService";

/**
 * Schema validasi untuk create/update karyawan
 */
export const createKaryawanSchema = z.object({
  nama: z.string().min(1, "Nama karyawan wajib diisi"),
  telepon: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val === "" || /^[0-9]+$/.test(val),
      {
        message: "Nomor telepon harus berupa angka",
      }
    )
    .transform((val) => (val === "" ? null : val)),
  alamat: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  gajiId: z.string().min(1, "Gaji wajib diisi"),
  email: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val === "" || z.string().email().safeParse(val).success, {
      message: "Format email tidak valid",
    })
    .transform((val) => (val === "" ? null : val)),
  groupId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  gender: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === "" || val === undefined || val === null) return null;
      const n = typeof val === "string" ? parseInt(val, 10) : val;
      return isNaN(n) ? null : n;
    }),
});

/**
 * Type untuk form data berdasarkan schema
 */
export type CreateKaryawanFormData = z.infer<typeof createKaryawanSchema>;

/**
 * Membuat form config untuk create/edit karyawan
 */
export const createFormConfig = (
  initialData?: Karyawan,
  gajiOptions: { value: string; label: string }[] = []
): FormConfig<CreateKaryawanDto> => {
  return {
    title: initialData ? "Edit Karyawan" : "Tambah Karyawan",
    description: initialData
      ? "Ubah informasi karyawan di bawah ini"
      : "Isi form di bawah ini untuk menambah karyawan baru",
    fields: [
      {
        name: "nama",
        label: "Nama Karyawan",
        type: "text",
        placeholder: "Masukkan nama karyawan",
        validation: z.string().min(1, "Nama karyawan wajib diisi"),
        defaultValue: initialData?.nama || "",
      },
      {
        name: "gajiId",
        label: "Gaji *",
        type: "select",
        placeholder: "Pilih gaji",
        options: gajiOptions,
        validation: z.string().min(1, "Gaji wajib diisi"),
        defaultValue: initialData?.gajiId ? String(initialData.gajiId) : "",
      },
      {
        name: "telepon",
        label: "No. Telepon (Opsional)",
        type: "text",
        placeholder: "Masukkan nomor telepon",
        validation: z
          .string()
          .optional()
          .nullable()
          .refine(
            (val) => !val || val === "" || /^[0-9]+$/.test(val),
            {
              message: "Nomor telepon harus berupa angka",
            }
          ),
        defaultValue: initialData?.telepon || "",
      },
      {
        name: "alamat",
        label: "Alamat (Opsional)",
        type: "textarea",
        placeholder: "Masukkan alamat",
        validation: z.string().optional().nullable(),
        defaultValue: initialData?.alamat || "",
      },
      {
        name: "email",
        label: "Email (Opsional)",
        type: "email",
        placeholder: "contoh@email.com",
        validation: z.string().optional().nullable(),
        defaultValue: initialData?.email || "",
      },
      {
        name: "groupId",
        label: "Group ID (Hik)",
        type: "text",
        placeholder: "1",
        description: "ID grup untuk HikConnect, default 1",
        validation: z.string().optional().nullable(),
        defaultValue: initialData?.groupId ?? "1",
      },
      {
        name: "gender",
        label: "Jenis Kelamin",
        type: "select",
        placeholder: "Pilih",
        options: [
          { value: "1", label: "Laki-laki" },
          { value: "2", label: "Perempuan" },
        ],
        validation: z.union([z.string(), z.number()]).optional().nullable(),
        defaultValue: initialData?.gender != null ? String(initialData.gender) : "1",
      },
    ],
    schema: createKaryawanSchema,
    defaultValues: {
      nama: initialData?.nama || "",
      gajiId: initialData?.gajiId ? String(initialData.gajiId) : "",
      telepon: initialData?.telepon || "",
      alamat: initialData?.alamat || "",
      email: initialData?.email || "",
      groupId: initialData?.groupId ?? "1",
      gender: initialData?.gender != null ? String(initialData.gender) : "1",
    } as any,
    onSubmit: async () => {},
  };
};