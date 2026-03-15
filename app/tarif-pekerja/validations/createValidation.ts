import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { TarifPekerjaItem, CreateTarifPekerjaDto } from "@/services/tarifPekerjaService";

export const createTarifPekerjaSchema = z.object({
  nama: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  tipe: z.enum(["PENJEMUR", "PENGUPAS"]),
  tarifPerKg: z
    .union([z.number().min(0, "Tarif harus ≥ 0"), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val.replace(/\D/g, ""));
        if (isNaN(parsed) || parsed < 0) {
          throw new Error("Tarif harus berupa angka ≥ 0");
        }
        return parsed;
      }
      return val;
    }),
});

export type CreateTarifPekerjaFormData = z.infer<typeof createTarifPekerjaSchema>;

export const createFormConfig = (
  initialData?: TarifPekerjaItem | null
): FormConfig<CreateTarifPekerjaDto> => ({
  title: initialData ? "Edit Tarif" : "Tambah Tarif",
  description:
    initialData
      ? "Ubah nama (opsional), tipe, dan tarif per kg."
      : "Isi nama (opsional), tipe, dan tarif per kg. Pekerja memilih tarif di Master → Pekerja.",
  fields: [
    {
      name: "nama",
      label: "Nama / Label (opsional)",
      type: "text",
      placeholder: "Contoh: Tarif Standar",
      validation: z.string().optional(),
      defaultValue: initialData?.nama ?? "",
    },
    {
      name: "tipe",
      label: "Tipe",
      type: "select",
      placeholder: "Pilih tipe",
      options: [
        { value: "PENJEMUR", label: "Penjemur" },
        { value: "PENGUPAS", label: "Pengupas" },
      ],
      validation: z.enum(["PENJEMUR", "PENGUPAS"]),
      defaultValue: initialData?.tipe ?? "PENJEMUR",
    },
    {
      name: "tarifPerKg",
      label: "Tarif per kg (Rp)",
      type: "currency",
      placeholder: "0",
      validation: z
        .union([z.number().min(0), z.string()])
        .transform((val) => {
          if (typeof val === "string") {
            const parsed = parseFloat(val.replace(/\D/g, ""));
            if (isNaN(parsed) || parsed < 0) throw new Error("Tarif harus ≥ 0");
            return parsed;
          }
          return val;
        }),
      defaultValue: initialData?.tarifPerKg != null ? String(initialData.tarifPerKg) : "",
    },
  ],
  schema: createTarifPekerjaSchema,
  defaultValues: {
    nama: initialData?.nama ?? "",
    tipe: initialData?.tipe ?? "PENJEMUR",
    tarifPerKg: initialData?.tarifPerKg != null ? String(initialData.tarifPerKg) : "",
  } as any,
  onSubmit: async () => {},
});
