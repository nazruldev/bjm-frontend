import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { Gaji, CreateGajiDto } from "@/services/gajiService";

/**
 * Schema validasi untuk create/update gaji
 * Menggunakan transform untuk mengkonversi string dari form ke number
 */
export const createGajiSchema = z.object({
  nama: z.string().min(1, "Nama harus diisi"),
  jumlah: z
    .union([z.number().positive("Jumlah harus positif"), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        if (isNaN(parsed) || parsed <= 0) {
          throw new Error("Jumlah harus berupa angka positif");
        }
        return parsed;
      }
      return val;
    }),
});

/**
 * Type untuk form data berdasarkan schema
 */
export type CreateGajiFormData = z.infer<typeof createGajiSchema>;

/**
 * Membuat form config untuk create/edit gaji
 */
export const createFormConfig = (
  initialData?: Gaji
): FormConfig<CreateGajiDto> => {
  return {
    title: initialData ? "Edit Gaji" : "Tambah Gaji",
    description: initialData
      ? "Ubah informasi gaji di bawah ini"
      : "Isi form di bawah ini untuk menambah gaji baru",
    fields: [
      {
        name: "nama",
        label: "Nama Gaji",
        type: "text",
        placeholder: "Masukkan nama gaji",
        validation: z.string().min(1, "Nama harus diisi"),
        defaultValue: initialData?.nama || "",
      },
      {
        name: "jumlah",
        label: "Jumlah",
        type: "currency",
        placeholder: "Masukkan jumlah gaji",
        validation: z
          .union([z.number().positive("Jumlah harus positif"), z.string()])
          .transform((val) => {
            if (typeof val === "string") {
              const parsed = parseFloat(val);
              if (isNaN(parsed) || parsed <= 0) {
                throw new Error("Jumlah harus berupa angka positif");
              }
              return parsed;
            }
            return val;
          }),
        defaultValue: initialData?.jumlah ? String(initialData.jumlah) : "",
      },
    ],
    schema: createGajiSchema,
    defaultValues: {
      nama: initialData?.nama || "",
      jumlah: initialData?.jumlah ? String(initialData.jumlah) : "",
    } as any,
    onSubmit: async () => {},
  };
};

