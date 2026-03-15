import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type {
  CreatePiutangDto,
  BayarPiutangDto,
} from "@/services/piutangService";

/**
 * Schema validasi untuk create piutang
 */
export const createPiutangSchema = z.object({
  subjekType: z.enum(["KARYAWAN", "PEKERJA", "PEMASOK"], {
    message: "Tipe subjek wajib dipilih",
  }),
  subjekId: z.string().min(1, "Subjek wajib dipilih"),
  total: z
    .union([z.number().positive("Total harus lebih dari 0"), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val.replace(/[^\d.-]/g, ""));
        if (isNaN(parsed) || parsed <= 0) {
          throw new Error("Total harus lebih dari 0");
        }
        return parsed;
      }
      return val;
    }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
});

/**
 * Schema validasi untuk bayar piutang
 */
export const createBayarPiutangSchema = (maxSisaPiutang?: number) => {
  return z.object({
    totalBayar: z
      .union([z.number().positive("Total bayar harus lebih dari 0"), z.string()])
      .transform((val) => {
        if (typeof val === "string") {
          const parsed = parseFloat(val.replace(/[^\d.-]/g, ""));
          if (isNaN(parsed) || parsed <= 0) {
            throw new Error("Total bayar harus lebih dari 0");
          }
          return parsed;
        }
        return val;
      })
      .refine(
        (val) => {
          if (maxSisaPiutang !== undefined && maxSisaPiutang !== null) {
            return val <= maxSisaPiutang;
          }
          return true;
        },
        {
          message: `Total bayar tidak boleh melebihi sisa kasbon (${maxSisaPiutang !== undefined && maxSisaPiutang !== null ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(maxSisaPiutang) : ""})`,
        }
      ),
    isCashless: z.boolean().optional().default(false),
    rekeningId: z.string().optional().nullable(),
    catatan: z.string().optional().nullable(),
  });
};

/**
 * Membuat form config untuk create piutang
 */
export const createPiutangFormConfig = (): FormConfig<CreatePiutangDto> => {
  return {
    title: "Tambah Kasbon",
    description: "Isi form di bawah ini untuk menambah kasbon baru",
    fields: [
      {
        name: "subjekType",
        label: "Tipe Subjek *",
        type: "select",
        placeholder: "Pilih tipe subjek",
        options: [
          { value: "KARYAWAN", label: "Karyawan" },
          { value: "PEKERJA", label: "Pekerja" },
          { value: "PEMASOK", label: "Pemasok" },
        ],
        validation: z.enum(["KARYAWAN", "PEKERJA", "PEMASOK"], {
          message: "Tipe subjek wajib dipilih",
        }),
        defaultValue: "",
      },
      {
        name: "subjekId",
        label: "Subjek *",
        type: "select",
        placeholder: "Pilih subjek",
        options: [], // Will be populated dynamically based on subjekType
        validation: z.string().min(1, "Subjek wajib dipilih"),
        defaultValue: "",
      },
      {
        name: "total",
        label: "Total Kasbon *",
        type: "currency",
        placeholder: "Masukkan total kasbon",
        validation: z
          .union([z.number().positive("Total harus lebih dari 0"), z.string()])
          .transform((val) => {
            if (typeof val === "string") {
              const parsed = parseFloat(val.replace(/[^\d.-]/g, ""));
              if (isNaN(parsed) || parsed <= 0) {
                throw new Error("Total harus lebih dari 0");
              }
              return parsed;
            }
            return val;
          }),
        defaultValue: "",
      },
      {
        name: "createdAt",
        label: "Tanggal transaksi (created_at)",
        type: "date",
        placeholder: "Pilih tanggal",
        validation: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
        defaultValue: (() => {
          const t = new Date();
          return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
        })(),
      },
    ],
    schema: createPiutangSchema,
    defaultValues: {
      subjekType: "" as any,
      subjekId: "",
      total: "",
      createdAt: (() => {
        const t = new Date();
        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
      })(),
    } as any,
    onSubmit: async () => {},
  };
};

/**
 * Membuat form config untuk bayar piutang
 */
export const createBayarPiutangFormConfig = (
  rekeningOptions: { value: string; label: string }[] = [],
  sisaPiutang?: number
): FormConfig<BayarPiutangDto> => {
  const maxSisaPiutang = sisaPiutang !== undefined && sisaPiutang !== null ? sisaPiutang : undefined;
  const bayarPiutangSchema = createBayarPiutangSchema(maxSisaPiutang);
  
  return {
    title: "Bayar Kasbon",
    description: maxSisaPiutang !== undefined 
      ? `Isi form di bawah ini untuk membayar kasbon. Sisa kasbon: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(maxSisaPiutang)}`
      : "Isi form di bawah ini untuk membayar kasbon",
    fields: [
      {
        name: "totalBayar",
        label: "Total Bayar *",
        type: "currency",
        placeholder: maxSisaPiutang !== undefined 
          ? `Maksimal ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(maxSisaPiutang)}`
          : "Masukkan total bayar",
        validation: z
          .union([
            z.number().positive("Total bayar harus lebih dari 0"),
            z.string(),
          ])
          .transform((val) => {
            if (typeof val === "string") {
              const parsed = parseFloat(val.replace(/[^\d.-]/g, ""));
              if (isNaN(parsed) || parsed <= 0) {
                throw new Error("Total bayar harus lebih dari 0");
              }
              return parsed;
            }
            return val;
          })
          .refine(
            (val) => {
              if (maxSisaPiutang !== undefined && maxSisaPiutang !== null) {
                return val <= maxSisaPiutang;
              }
              return true;
            },
            {
              message: `Total bayar tidak boleh melebihi sisa kasbon (${maxSisaPiutang !== undefined && maxSisaPiutang !== null ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(maxSisaPiutang) : ""})`,
            }
          ),
        defaultValue: "",
      },
      {
        name: "isCashless",
        label: "Cashless ( Pembayaran Non Tunai )",
        type: "checkbox",
        validation: z.boolean().optional().default(false),
        defaultValue: "false",
      },
      {
        name: "rekeningId",
        label: "Rekening Tujuan",
        type: "select",
        placeholder: "Pilih rekening",
        options: rekeningOptions,
        validation: z.string().optional().nullable(),
        defaultValue: "",
        isDisabled: (formValues) => !formValues.isCashless,
      },
      {
        name: "catatan",
        label: "Catatan (Opsional)",
        type: "textarea",
        placeholder: "Masukkan catatan",
        validation: z.string().optional().nullable(),
        defaultValue: "",
      },
    ],
    schema: bayarPiutangSchema,
    defaultValues: {
      totalBayar: "",
      isCashless: false,
      rekeningId: "",
      catatan: "",
    } as any,
    onSubmit: async () => {},
  };
};
