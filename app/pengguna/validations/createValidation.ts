import * as z from "zod";
import type { FormConfig } from "@/components/datatables/customForm";
import type { Pengguna, CreatePenggunaDto } from "@/services/penggunaService";

// Constant untuk value "tidak ada outlet"
export const NO_OUTLET_VALUE = "__none__";

/**
 * Schema validasi untuk create/update pengguna
 */
export const createPenggunaSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .optional()
    .or(z.literal("")), // Allow empty string for update
  nama: z.string().min(1, "Nama harus diisi"),
  role: z.enum(["ADMIN", "KASIR", "INSPECTOR", "OWNER"]).optional(),
  telepon: z.string().optional().nullable(),
  outletId: z.string().optional().nullable(),
}).refine((data) => {
  // Jika role bukan ADMIN dan bukan OWNER, outletId wajib diisi (tidak boleh NO_OUTLET_VALUE atau kosong)
  if (data.role && data.role !== 'ADMIN' && data.role !== 'OWNER') {
    return !!data.outletId && data.outletId !== NO_OUTLET_VALUE && data.outletId.trim() !== '';
  }
  return true;
}, {
  message: 'Outlet wajib diisi untuk role selain ADMIN dan OWNER',
  path: ['outletId'],
}).refine((data) => {
  // Jika role adalah OWNER, telepon wajib diisi
  if (data.role === "OWNER") {
    return !!data.telepon && String(data.telepon).trim() !== "";
  }
  return true;
}, {
  message: "Nomor telepon wajib diisi untuk role OWNER",
  path: ["telepon"],
});

/**
 * Type untuk form data berdasarkan schema
 */
export type CreatePenggunaFormData = z.infer<typeof createPenggunaSchema>;

/**
 * Membuat form config untuk create/edit pengguna
 */
export const createFormConfig = (
  initialData?: Pengguna,
  outletOptions: { value: string; label: string }[] = []
): FormConfig<CreatePenggunaDto> => {
  // Convert null/undefined outletId to NO_OUTLET_VALUE for form
  const outletIdForForm = initialData?.outletId || NO_OUTLET_VALUE;

  return {
    title: initialData ? "Edit Pengguna" : "Tambah Pengguna",
    description: initialData
      ? "Ubah informasi pengguna di bawah ini"
      : "Isi form di bawah ini untuk menambah pengguna baru",
    fields: [
      {
        name: "nama",
        label: "Nama",
        type: "text",
        placeholder: "Masukkan nama pengguna",
        validation: z.string().min(1, "Nama harus diisi"),
        defaultValue: initialData?.nama || "",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "Masukkan email",
        validation: z.string().email("Email tidak valid"),
        defaultValue: initialData?.email || "",
      },
      {
        name: "password",
        label: initialData ? "Password (Kosongkan jika tidak diubah)" : "Password",
        type: "text",
        placeholder: "Masukkan password",
        validation: initialData
          ? z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal(""))
          : z.string().min(6, "Password minimal 6 karakter"),
        defaultValue: "",
      },
      {
        name: "role",
        label: "Role",
        type: "select",
        placeholder: "Pilih role",
        options: [
          { value: "ADMIN", label: "Admin" },
          { value: "KASIR", label: "Kasir" },
          { value: "INSPECTOR", label: "Inspector" },
          { value: "OWNER", label: "Owner" },
        ],
        validation: z.enum(["ADMIN", "KASIR", "INSPECTOR", "OWNER"]).optional(),
        defaultValue: initialData?.role || "KASIR",
      },
      {
        name: "telepon",
        label: "Telepon (wajib untuk Owner)",
        type: "text",
        placeholder: "Nomor telepon",
        validation: z.string().optional().nullable(),
        defaultValue: initialData?.telepon ?? "",
      },
      {
        name: "outletId",
        label: "Outlet",
        type: "select",
        placeholder: "Pilih outlet",
        options: [
          { value: NO_OUTLET_VALUE, label: "Tidak ada outlet" },
          ...outletOptions,
        ],
        validation: z.string().optional().nullable(),
        defaultValue: outletIdForForm,
      },
    ],
    schema: createPenggunaSchema,
    defaultValues: {
      email: initialData?.email || "",
      password: "",
      nama: initialData?.nama || "",
      role: initialData?.role || "KASIR",
      telepon: initialData?.telepon ?? "",
      outletId: outletIdForForm,
    } as any,
    onSubmit: async () => {},
  };
};