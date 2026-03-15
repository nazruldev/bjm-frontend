import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { MutasiStok, CreateMutasiStokDto } from "@/services/mutasiStokService";
import { useProduks } from "@/hooks/useProduks";
import { parseJumlahID, toLocalDateStringOnly } from "@/lib/utils";

const jumlahTransform = (val: unknown) => {
  if (typeof val === "number") {
    if (val <= 0) throw new Error("Jumlah harus positif");
    return val;
  }
  const str = String(val ?? "").trim();
  if (!str) throw new Error("Jumlah wajib diisi");
  const parsed = parseJumlahID(str);
  if (parsed <= 0) throw new Error("Jumlah harus positif");
  return parsed;
};

/**
 * Schema validasi untuk create/update mutasi stok
 */
export const createMutasiStokSchema = z.object({
  produkId: z.string().min(1, "Produk wajib diisi"),
  jumlah: z.union([z.number().positive(), z.string()]).transform(jumlahTransform),
  tipe: z.enum(["MASUK", "KELUAR", "SUSUT", "HILANG", "RUSAK"]),
  tanggal: z
    .union([z.string(), z.date()])
    .refine((val) => {
      if (!val) return false;
      if (typeof val === "string") {
        const date = new Date(val);
        return !isNaN(date.getTime());
      }
      return val instanceof Date && !isNaN(val.getTime());
    }, {
      message: "Tanggal wajib diisi",
    })
    .transform((val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    }),
  penjemuranId: z.string().optional().nullable(),
  pembelianId: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
});

/**
 * Type untuk form data berdasarkan schema
 */
export type CreateMutasiStokFormData = z.infer<typeof createMutasiStokSchema>;

/**
 * Membuat form config untuk create/edit mutasi stok
 */
export const createFormConfig = (
  initialData?: MutasiStok,
  produkOptions: { value: string; label: string }[] = []
): FormConfig<CreateMutasiStokDto> => {
  return {
    title: initialData ? "Edit Mutasi Stok" : "Tambah Mutasi Stok",
    description: initialData
      ? "Ubah informasi mutasi stok di bawah ini"
      : "Isi form di bawah ini untuk menambah mutasi stok baru",
    fields: [
      {
        name: "produkId",
        label: "Produk *",
        type: "select",
        placeholder: "Pilih produk",
        options: produkOptions,
        validation: z.string().min(1, "Produk wajib diisi"),
        defaultValue: initialData?.produkId || "",
      },
      {
        name: "jumlah",
        label: "Jumlah *",
        type: "jumlahKg",
        placeholder: "0",
        validation: z.union([z.number().positive(), z.string()]).transform(jumlahTransform),
        defaultValue: initialData?.jumlah
          ? String(initialData.jumlah)
          : "",
      },
      {
        name: "tipe",
        label: "Tipe Mutasi *",
        type: "select",
        placeholder: "Pilih tipe mutasi",
        options: [
          { value: "MASUK", label: "Masuk" },
          { value: "KELUAR", label: "Keluar" },
          { value: "SUSUT", label: "Susut" },
          { value: "HILANG", label: "Hilang" },
          { value: "RUSAK", label: "Rusak" },
        ],
        validation: z.enum(["MASUK", "KELUAR", "SUSUT", "HILANG", "RUSAK"]),
        defaultValue: initialData?.tipe || "",
      },
      {
        name: "tanggal",
        label: "Tanggal *",
        type: "date",
        placeholder: "Pilih tanggal",
        validation: z
          .union([z.string(), z.date()])
          .refine((val) => {
            if (!val) return false;
            if (typeof val === "string") {
              const date = new Date(val);
              return !isNaN(date.getTime());
            }
            return val instanceof Date && !isNaN(val.getTime());
          }, {
            message: "Tanggal wajib diisi",
          })
          .transform((val) => {
            if (typeof val === "string") {
              return new Date(val);
            }
            return val;
          }),
        defaultValue: initialData?.tanggal
          ? toLocalDateStringOnly(initialData.tanggal as string | Date)
          : "",
      },
      {
        name: "keterangan",
        label: "Keterangan (Opsional)",
        type: "textarea",
        placeholder: "Masukkan keterangan",
        validation: z.string().optional().nullable(),
        defaultValue: initialData?.keterangan || "",
      },
    ],
    schema: createMutasiStokSchema,
    defaultValues: {
      produkId: initialData?.produkId || "",
      jumlah: initialData?.jumlah ? String(initialData.jumlah) : "",
      tipe: initialData?.tipe || "",
      tanggal: initialData?.tanggal
        ? typeof initialData.tanggal === "string"
          ? new Date(initialData.tanggal)
          : initialData.tanggal
        : undefined,
      penjemuranId: initialData?.penjemuranId || "",
      pembelianId: initialData?.pembelianId || "",
      keterangan: initialData?.keterangan || "",
    } as any,
    onSubmit: async () => {},
  };
};

