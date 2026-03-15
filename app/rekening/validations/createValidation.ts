import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { Rekening, CreateRekeningDto } from "@/services/rekeningService";

/** Daftar bank untuk select (konsisten, tidak perlu ketik) */
export const BANK_OPTIONS = [
  { value: "BCA", label: "BCA" },
  { value: "BNI", label: "BNI" },
  { value: "BRI", label: "BRI" },
  { value: "BTN", label: "BTN" },
  { value: "Bank Mandiri", label: "Bank Mandiri" },
  { value: "Bank Bukopin", label: "Bank Bukopin" },
  { value: "Bank Danamon", label: "Bank Danamon" },
  { value: "Bank Mega", label: "Bank Mega" },
  { value: "Bank CIMB Niaga", label: "Bank CIMB Niaga" },
  { value: "Bank Permata", label: "Bank Permata" },
  { value: "Bank Sinarmas", label: "Bank Sinarmas" },
  { value: "Bank QNB", label: "Bank QNB" },
  { value: "Bank Lippo", label: "Bank Lippo" },
  { value: "Bank UOB", label: "Bank UOB" },
  { value: "Panin Bank", label: "Panin Bank" },
  { value: "Citibank", label: "Citibank" },
  { value: "Bank ANZ", label: "Bank ANZ" },
  { value: "Bank Commonwealth", label: "Bank Commonwealth" },
  { value: "Bank Maybank", label: "Bank Maybank" },
  { value: "Bank Maspion", label: "Bank Maspion" },
  { value: "Bank J Trust", label: "Bank J Trust" },
  { value: "Bank KEB Hana", label: "Bank KEB Hana" },
  { value: "Bank Artha Graha", label: "Bank Artha Graha" },
  { value: "Bank OCBC NISP", label: "Bank OCBC NISP" },
  { value: "Bank MNC", label: "Bank MNC" },
  { value: "Bank DBS", label: "Bank DBS" },
  { value: "Bank DKI", label: "Bank DKI" },
  { value: "Bank BJB", label: "Bank BJB" },
  { value: "Bank BPD DIY", label: "Bank BPD DIY" },
  { value: "Bank Jateng", label: "Bank Jateng" },
  { value: "Bank Jatim", label: "Bank Jatim" },
  { value: "Bank BPD Bali", label: "Bank BPD Bali" },
  { value: "Bank Sumut", label: "Bank Sumut" },
  { value: "Bank Nagari", label: "Bank Nagari" },
  { value: "Bank Riau Kepri", label: "Bank Riau Kepri" },
  { value: "Bank Sumsel Babel", label: "Bank Sumsel Babel" },
  { value: "Bank Lampung", label: "Bank Lampung" },
  { value: "Bank Jambi", label: "Bank Jambi" },
  { value: "Bank Kalbar", label: "Bank Kalbar" },
  { value: "Bank Kalteng", label: "Bank Kalteng" },
  { value: "Bank Kalsel", label: "Bank Kalsel" },
  { value: "Bank Kaltim", label: "Bank Kaltim" },
  { value: "Bank Sulsel", label: "Bank Sulsel" },
  { value: "Bank Sultra", label: "Bank Sultra" },
  { value: "Bank BPD Sulteng", label: "Bank BPD Sulteng" },
  { value: "Bank Sulut", label: "Bank Sulut" },
  { value: "Bank NTB", label: "Bank NTB" },
  { value: "Bank NTT", label: "Bank NTT" },
  { value: "Bank Maluku", label: "Bank Maluku" },
  { value: "Bank Papua", label: "Bank Papua" },
];

/**
 * Schema validasi untuk create/update rekening
 */
export const createRekeningSchema = z.object({
  bank: z.string().min(1, "Bank wajib diisi"),
  nama: z.string().min(1, "Nama rekening wajib diisi"),
  nomor: z.string().min(1, "Nomor rekening wajib diisi"),
  isActive: z.boolean().optional(),
});

/**
 * Type untuk form data berdasarkan schema
 */
export type CreateRekeningFormData = z.infer<typeof createRekeningSchema>;

/**
 * Membuat form config untuk create/edit rekening
 */
export const createFormConfig = (
  initialData?: Rekening
): FormConfig<CreateRekeningDto> => {
  return {
    title: initialData ? "Edit Rekening" : "Tambah Rekening",
    description: initialData
      ? "Ubah informasi rekening di bawah ini"
      : "Isi form di bawah ini untuk menambah rekening baru",
    fields: [
      {
        name: "bank",
        label: "Bank",
        type: "select",
        placeholder: "Pilih bank",
        options: BANK_OPTIONS,
        validation: z.string().min(1, "Bank wajib diisi"),
        defaultValue: initialData?.bank || "",
      },
      {
        name: "nama",
        label: "Nama Rekening",
        type: "text",
        placeholder: "Masukkan nama rekening",
        validation: z.string().min(1, "Nama rekening wajib diisi"),
        defaultValue: initialData?.nama || "",
      },
      {
        name: "nomor",
        label: "Nomor Rekening",
        type: "text",
        placeholder: "Masukkan nomor rekening",
        validation: z.string().min(1, "Nomor rekening wajib diisi"),
        defaultValue: initialData?.nomor || "",
      },
      {
        name: "isActive",
        label: "Status Aktif",
        type: "checkbox",
        placeholder: "",
        validation: z.boolean().optional(),
        defaultValue: (initialData?.isActive ?? true).toString(),
      },
    ],
    schema: createRekeningSchema,
    defaultValues: {
      bank: initialData?.bank || "",
      nama: initialData?.nama || "",
      nomor: initialData?.nomor || "",
      isActive: initialData?.isActive ?? true,
    } as any,
    onSubmit: async () => {},
  };
};