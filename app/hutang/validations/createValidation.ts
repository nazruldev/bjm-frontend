import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { BayarHutangDto } from "@/services/hutangService";

/**
 * Schema validasi untuk bayar hutang
 */
export const createBayarHutangSchema = (maxSisaHutang?: number) => {
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
          if (maxSisaHutang !== undefined && maxSisaHutang !== null) {
            return val <= maxSisaHutang;
          }
          return true;
        },
        {
          message: `Total bayar tidak boleh melebihi sisa hutang (${maxSisaHutang !== undefined && maxSisaHutang !== null ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(maxSisaHutang) : ""})`,
        }
      ),
    isCashless: z.boolean().optional().default(false),
    rekeningId: z.string().optional().nullable(),
    catatan: z.string().optional().nullable(),
  });
};

/**
 * Membuat form config untuk bayar hutang
 */
export const createBayarHutangFormConfig = (
  rekeningOptions: { value: string; label: string }[] = [],
  sisaHutang?: number
): FormConfig<BayarHutangDto> => {
  const maxSisaHutang = sisaHutang !== undefined && sisaHutang !== null ? sisaHutang : undefined;
  const bayarHutangSchema = createBayarHutangSchema(maxSisaHutang);
  
  return {
    title: "Bayar Hutang",
    description: maxSisaHutang !== undefined 
      ? `Isi form di bawah ini untuk membayar hutang. Sisa hutang: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(maxSisaHutang)}`
      : "Isi form di bawah ini untuk membayar hutang",
    fields: [
      {
        name: "totalBayar",
        label: "Total Bayar *",
        type: "currency",
        placeholder: maxSisaHutang !== undefined 
          ? `Maksimal ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(maxSisaHutang)}`
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
              if (maxSisaHutang !== undefined && maxSisaHutang !== null) {
                return val <= maxSisaHutang;
              }
              return true;
            },
            {
              message: `Total bayar tidak boleh melebihi sisa hutang (${maxSisaHutang !== undefined && maxSisaHutang !== null ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(maxSisaHutang) : ""})`,
            }
          ),
        defaultValue: "",
      },
      {
        name: "isCashless",
        label: "Cashless ( Pembayaran Non Tunai )",
        type: "checkbox",
        validation: z.boolean().optional().default(false),
        defaultValue: "",
      },
      {
        name: "rekeningId",
        label: "Rekening Sumber",
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
        description: "NB: Harap masukan nomor rekening dan nama dan bank apa untuk penerima",
      },
    ],
    schema: bayarHutangSchema,
    defaultValues: {
      totalBayar: "",
      isCashless: false,
      rekeningId: "",
      catatan: "",
    } as any,
    onSubmit: async () => {},
  };
};

