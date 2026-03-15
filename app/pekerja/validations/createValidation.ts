import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { Pekerja, CreatePekerjaDto } from "@/services/pekerjaService";
import type { TarifPekerjaItem } from "@/services/tarifPekerjaService";

/**
 * Schema validasi untuk create/update pekerja
 */
export const createPekerjaSchema = z.object({
  nama: z.string().min(1, "Nama pekerja wajib diisi"),
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
  type: z.enum(["PENJEMUR", "PENGUPAS"]).refine(
    (val) => val === "PENJEMUR" || val === "PENGUPAS",
    {
      message: "Tipe pekerja wajib dipilih",
    }
  ),
  tarifPekerjaId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" || !v?.trim() ? null : v)),
});

/**
 * Type untuk form data berdasarkan schema
 */
export type CreatePekerjaFormData = z.infer<typeof createPekerjaSchema>;

/**
 * Membuat form config untuk create/edit pekerja.
 * tarifList: daftar master tarif untuk dropdown (opsional).
 */
export const createFormConfig = (
  initialData?: Pekerja,
  tarifList: TarifPekerjaItem[] = []
): FormConfig<CreatePekerjaDto> => {
  const tarifOptions = tarifList.map((t) => ({
    value: t.id,
    label: `[${t.tipe === "PENJEMUR" ? "Penjemur" : "Pengupas"}] ${t.nama || "Tanpa nama"} — Rp ${Number(t.tarifPerKg).toLocaleString("id-ID")}/kg`,
  }));

  return {
    title: initialData ? "Edit Pekerja" : "Tambah Pekerja",
    description: initialData
      ? "Ubah informasi pekerja di bawah ini"
      : "Isi form di bawah ini untuk menambah pekerja baru",
    fields: [
      {
        name: "nama",
        label: "Nama Pekerja",
        type: "text",
        placeholder: "Masukkan nama pekerja",
        validation: z.string().min(1, "Nama pekerja wajib diisi"),
        defaultValue: initialData?.nama || "",
      },
      {
        name: "type",
        label: "Tipe Pekerja",
        type: "select",
        placeholder: "Pilih tipe pekerja",
        options: [
          { value: "PENJEMUR", label: "Penjemur" },
          { value: "PENGUPAS", label: "Pengupas" },
        ],
        validation: z.enum(["PENJEMUR", "PENGUPAS"]).refine(
          (val) => val === "PENJEMUR" || val === "PENGUPAS",
          {
            message: "Tipe pekerja wajib dipilih",
          }
        ),
        defaultValue: initialData?.type || "PENJEMUR",
      },
      {
        name: "tarifPekerjaId",
        label: "Tarif (dari Master Tarif)",
        type: "select",
        placeholder: tarifOptions.length === 0 ? "Belum ada tarif" : "Pilih tarif",
        options: tarifOptions,
        validation: z.string().optional().nullable(),
        defaultValue: initialData?.tarifPekerjaId ?? "",
      },
      {
        name: "telepon",
        label: "No. Telepon (Opsional)",
        type: "phone",
        placeholder: "0812-3456-7890",
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
    schema: createPekerjaSchema,
    defaultValues: {
      nama: initialData?.nama || "",
      telepon: initialData?.telepon || "",
      alamat: initialData?.alamat || "",
      type: initialData?.type || "PENJEMUR",
      tarifPekerjaId: initialData?.tarifPekerjaId ?? "",
    } as any,
    onSubmit: async () => {},
  };
};
