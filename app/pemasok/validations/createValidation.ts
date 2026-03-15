import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { Pemasok, CreatePemasokDto } from "@/services/pemasokService";

/**
 * Schema validasi untuk create/update pemasok
 */
export const createPemasokSchema = z.object({
  nama: z.string().min(1, "Nama pemasok wajib diisi"),
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
});

/**
 * Type untuk form data berdasarkan schema
 */
export type CreatePemasokFormData = z.infer<typeof createPemasokSchema>;

/**
 * Membuat form config untuk create/edit pemasok
 */
export const createFormConfig = (
  initialData?: Pemasok
): FormConfig<CreatePemasokDto> => {
  return {
    title: initialData ? "Edit Pemasok" : "Tambah Pemasok",
    description: initialData
      ? "Ubah informasi pemasok di bawah ini"
      : "Isi form di bawah ini untuk menambah pemasok baru",
    fields: [
      {
        name: "nama",
        label: "Nama Pemasok",
        type: "text",
        placeholder: "Masukkan nama pemasok",
        validation: z.string().min(1, "Nama pemasok wajib diisi"),
        defaultValue: initialData?.nama || "",
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
    ],
    schema: createPemasokSchema,
    defaultValues: {
      nama: initialData?.nama || "",
      telepon: initialData?.telepon || "",
      alamat: initialData?.alamat || "",
    } as any,
    onSubmit: async () => {},
  };
};
