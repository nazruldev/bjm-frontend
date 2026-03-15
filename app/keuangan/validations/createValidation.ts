import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { Keuangan, CreateKeuanganDto } from "@/services/keuanganService";
import { getTodayDateString, toLocalDateStringOnly } from "@/lib/utils";

export const createKeuanganSchema = z.object({
  invoice: z.string().optional(),
  arus: z.enum(["MASUK", "KELUAR"]).optional().default("KELUAR"),
  total: z.union([z.number().positive("Total harus positif"), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val.replace(/[^\d]/g, ""));
      if (isNaN(parsed) || parsed <= 0) throw new Error("Total harus berupa angka positif");
      return parsed;
    }
    return val;
  }),
  catatan: z.string().optional().nullable(),
  isCashless: z.boolean().optional().default(false),
  rekeningId: z.string().optional().nullable(),
  createdAt: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date()])
    .optional(),
}).refine((data) => !data.isCashless || !!data.rekeningId, {
  message: "Rekening sumber wajib diisi jika pembayaran non-tunai",
  path: ["rekeningId"],
});

export type CreateKeuanganFormData = z.infer<typeof createKeuanganSchema>;

export const createFormConfig = (
  initialData?: Keuangan,
  rekeningOptions: { value: string; label: string }[] = []
): FormConfig<CreateKeuanganDto> => ({
  title: initialData ? "Edit Keuangan" : "Tambah Keuangan",
  description: initialData ? "Ubah transaksi keuangan di bawah ini" : "Pilih tipe masuk atau keluar. Tercatat di Pembayaran.",
  fields: [
    { name: "arus", label: "Tipe *", type: "select", placeholder: "Pilih tipe", options: [{ value: "MASUK", label: "Masuk " }, { value: "KELUAR", label: "Keluar" }], validation: z.enum(["MASUK", "KELUAR"]), defaultValue: initialData?.arus ? String(initialData.arus) : "KELUAR" },
    { name: "total", label: "Jumlah *", type: "currency", placeholder: "0", validation: z.union([z.number().positive("Total harus positif"), z.string()]).transform((val) => { if (typeof val === "string") { const p = parseFloat(val.replace(/[^\d]/g, "")); if (isNaN(p) || p <= 0) throw new Error("Total harus berupa angka positif"); return p; } return val; }), defaultValue: initialData?.total ? String(initialData.total) : "" },
    { name: "catatan", label: "Catatan (Opsional)", type: "textarea", placeholder: "Masukkan catatan", validation: z.string().optional().nullable(), defaultValue: initialData?.catatan || "" },
    { name: "createdAt", label: "Tanggal transaksi", type: "date", placeholder: "Tanggal (opsional)", validation: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date()]).optional(), defaultValue: initialData?.createdAt ? toLocalDateStringOnly(initialData.createdAt) : getTodayDateString(), gridCols: 1},
    { name: "isCashless", label: "Pembayaran Non-Tunai", type: "checkbox", validation: z.boolean().optional().default(false), defaultValue: false },
    { name: "rekeningId", label: "Rekening Sumber", type: "select", placeholder: "Pilih rekening (jika non-tunai)", options: rekeningOptions, validation: z.string().optional().nullable(), defaultValue: "", isDisabled: (formValues) => !formValues.isCashless },
  ],
  schema: createKeuanganSchema,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValues: { arus: initialData?.arus || "KELUAR", total: initialData?.total ? String(initialData.total) : "", catatan: initialData?.catatan || "", createdAt: initialData?.createdAt ? toLocalDateStringOnly(initialData.createdAt) : getTodayDateString(), isCashless: false, rekeningId: "" } as any,
  onSubmit: async () => {},
});
