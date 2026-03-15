import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { Produk, CreateProdukDto } from "@/services/produkService";

/**
 * Schema validasi untuk create/update produk
 */
export const createProdukSchema = z.object({
  nama_produk: z.string().min(1, "Nama produk wajib diisi"),
  bisa_dijual: z.boolean().optional().default(false),
  bisa_dibeli: z.boolean().optional().default(false),
  isInput: z.boolean().optional().default(false),
  isOutput: z.boolean().optional().default(false),
  harga_jual: z
    .union([z.number().positive(), z.string()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      }
      return val;
    }),
});

/**
 * Type untuk form data berdasarkan schema
 */
export type CreateProdukFormData = z.infer<typeof createProdukSchema>;

/**
 * Membuat form config untuk create/edit produk
 * Untuk produk permanen (edit): hanya nama tidak ditampilkan (tidak bisa diubah); harga jual bisa diubah
 */
export const createFormConfig = (
  initialData?: Produk
): FormConfig<CreateProdukDto> => {
  const isPermanentEdit = !!(initialData?.isPermanent);
  const baseFields: FormConfig<CreateProdukDto>["fields"] = [
    {
      name: "nama_produk",
      label: "Nama Produk *",
      type: "text",
      placeholder: "Masukkan nama produk",
      validation: z.string().min(1, "Nama produk wajib diisi"),
      defaultValue: initialData?.nama_produk || "",
    },
    {
      name: "bisa_dijual",
      label: "Bisa Dijual",
      type: "checkbox",
      validation: z.boolean().optional().default(false),
    },
    {
      name: "bisa_dibeli",
      label: "Bisa Dibeli",
      type: "checkbox",
      validation: z.boolean().optional().default(false),
    },
    {
      name: "harga_jual",
      label: "Harga Jual (Opsional)",
      type: "currency",
      placeholder: "Masukkan harga jual",
      validation: z
        .union([z.number().positive(), z.string()])
        .optional()
        .nullable()
        .transform((val) => {
          if (val === "" || val === null || val === undefined) return null;
          if (typeof val === "string") {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? null : parsed;
          }
          return val;
        }),
      defaultValue: initialData?.harga_jual
        ? String(initialData.harga_jual)
        : "",
    },
  ];
  const fields = isPermanentEdit
    ? baseFields.filter((f) => f.name !== "nama_produk")
    : baseFields;

  const defaultValues: Record<string, unknown> = {
    nama_produk: initialData?.nama_produk || "",
    bisa_dijual: initialData?.bisa_dijual || false,
    bisa_dibeli: initialData?.bisa_dibeli || false,
    isInput: initialData?.isInput || false,
    isOutput: initialData?.isOutput || false,
    harga_jual: initialData?.harga_jual
      ? String(initialData.harga_jual)
      : "",
  };
  if (isPermanentEdit) {
    delete defaultValues.nama_produk;
  }

  return {
    title: initialData ? "Edit Produk" : "Tambah Produk",
    description: initialData
      ? isPermanentEdit
        ? "Produk permanen: hanya Nama tidak dapat diubah. Harga Jual, Bisa Dijual/Dibeli, dan Input/Output dapat diubah."
        : "Ubah informasi produk di bawah ini"
      : "Isi form di bawah ini untuk menambah produk baru",
    fields,
    schema: createProdukSchema,
    defaultValues: defaultValues as any,
    onSubmit: async () => {},
  };
};
