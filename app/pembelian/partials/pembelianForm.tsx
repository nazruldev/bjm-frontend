"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useConfirmPassword } from "@/components/dialog-confirm-password";
import { formatCurrency, parseCurrency, parseJumlah } from "@/lib/utils";
import type { CreatePembelianDto, Pembelian } from "@/services/pembelianService";

// Schema validasi
const createPembelianSchema = (detailLength: number) => z.object({
  pemasokId: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  detail: z
    .array(
      z.object({
        produkId: z.string().min(1, "Produk wajib dipilih"),
        jumlah: z.union([z.number().positive(), z.string()]).transform((val) => {
          if (typeof val === "string") {
            const parsed = parseFloat(parseJumlah(val));
            return isNaN(parsed) ? 0 : parsed;
          }
          return val;
        }),
        harga: z.union([z.number().positive(), z.string()]).optional().nullable().transform((val) => {
          if (val === null || val === undefined || val === "") return null;
          if (typeof val === "string") {
            const parsed = parseFloat(parseCurrency(val));
            return isNaN(parsed) ? null : parsed;
          }
          return val;
        }),
        subtotal: z.union([z.number().positive(), z.string()]).transform((val) => {
          if (typeof val === "string") {
            const parsed = parseFloat(parseCurrency(val));
            return isNaN(parsed) ? 0 : parsed;
          }
          return val;
        }),
      })
    )
    .min(1, "Minimal 1 item pembelian"),
}).refine((data) => {
  // Validasi: total harus sama dengan sum subtotal
  const calculatedTotal = data.detail.reduce((sum, item) => sum + Number(item.subtotal), 0);
  return calculatedTotal > 0;
}, {
  message: "Total pembelian harus lebih dari 0",
  path: ["detail"],
});

interface PembelianFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produkOptions: { value: string; label: string }[];
  pemasokOptions: { value: string; label: string }[];
  onSubmit: (data: CreatePembelianDto) => Promise<void>;
}

export function PembelianForm({
  open,
  onOpenChange,
  produkOptions,
  pemasokOptions,
  onSubmit,
}: PembelianFormProps) {
  const [detailValues, setDetailValues] = React.useState<any[]>([]);
  const [ongkosBongkarTimbang, setOngkosBongkarTimbang] = React.useState<string>("");
  const [jumlahBayar, setJumlahBayar] = React.useState<string>("0");
  const prevTotalAkhirRef = React.useRef(0);
  const { openConfirmPassword } = useConfirmPassword();
  const pendingPayloadRef = React.useRef<CreatePembelianDto | null>(null);

  // Initialize detail when dialog opens
  React.useEffect(() => {
    if (open) {
      setDetailValues([{ produkId: "", jumlah: "", harga: "", subtotal: "" }]);
      setOngkosBongkarTimbang("");
      setJumlahBayar("0");
      prevTotalAkhirRef.current = 0;
    }
  }, [open]);

  // Calculate total from detail
  const calculatedTotal = React.useMemo(() => {
    return detailValues.reduce((sum, item) => {
      const subtotal = parseFloat(parseCurrency(item.subtotal || "0")) || 0;
      return sum + subtotal;
    }, 0);
  }, [detailValues]);

  const ongkosNum = parseFloat(parseCurrency(ongkosBongkarTimbang || "0")) || 0;
  const totalAkhir = Math.max(0, calculatedTotal - ongkosNum);
  const jumlahBayarNum = parseFloat(parseCurrency(jumlahBayar || "0")) || 0;

  // Default Jumlah Bayar = Total Akhir; selalu angka minimal 0. Saat total berubah, ikuti total bila user belum ubah (masih sama dengan total sebelumnya).
  React.useEffect(() => {
    if (!open) return;
    const current = parseFloat(parseCurrency(jumlahBayar || "0")) || 0;
    const prev = prevTotalAkhirRef.current;
    if (totalAkhir === 0) {
      setJumlahBayar("0");
      prevTotalAkhirRef.current = 0;
      return;
    }
    if (current === prev || (prev === 0 && current === 0)) {
      setJumlahBayar(formatCurrency(totalAkhir));
    }
    prevTotalAkhirRef.current = totalAkhir;
  }, [open, totalAkhir, jumlahBayar]);

  // Create dynamic schema
  const pembelianSchemaMemo = React.useMemo(
    () => createPembelianSchema(detailValues.length),
    [detailValues.length]
  );

  const getTodayString = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  };

  const form = useForm({
    defaultValues: {
      pemasokId: "__walkin__",
      catatan: "",
      createdAt: getTodayString(),
      detail: [{ produkId: "", jumlah: "", harga: "", subtotal: "" }],
    } as any,
    validators: {
      onSubmit: pembelianSchemaMemo as any,
    },
    onSubmit: async ({ value }) => {
      try {
        const pemasokId = value.pemasokId === "__walkin__" || !value.pemasokId ? null : value.pemasokId;
        if (jumlahBayarNum > 0 && jumlahBayarNum < totalAkhir && !pemasokId) {
          toast.error("Pembelian walk-in harus lunas. Pilih pemasok jika ingin membayar sebagian atau tidak bayar (sisa jadi Hutang Usaha).");
          return;
        }
        if (jumlahBayarNum === 0 && !pemasokId) {
          toast.error("Pembelian walk-in tidak boleh kosong jumlah bayar. Pilih pemasok untuk mencatat sebagai hutang.");
          return;
        }
        if (jumlahBayarNum > totalAkhir) {
          toast.error("Jumlah bayar tidak boleh melebihi Total Akhir.");
          return;
        }

        // Transform detail
        const detail = value.detail.map((item: any) => {
          const jumlah = typeof item.jumlah === "string" 
            ? parseFloat(parseJumlah(item.jumlah)) 
            : item.jumlah;
          const harga = item.harga 
            ? (typeof item.harga === "string" 
                ? parseFloat(parseCurrency(item.harga)) 
                : item.harga)
            : null;
          const subtotal = typeof item.subtotal === "string"
            ? parseFloat(parseCurrency(item.subtotal))
            : item.subtotal;

          return {
            produkId: item.produkId,
            jumlah,
            harga,
            subtotal,
          };
        });

        const payload: CreatePembelianDto = {
          pemasokId,
          total: calculatedTotal,
          catatan: value.catatan || null,
          createdAt: typeof value.createdAt === "string" && value.createdAt ? value.createdAt : undefined,
          detail,
          ongkosBongkarTimbang: ongkosNum > 0 ? ongkosNum : undefined,
          isCashless: false,
        };
        // Default = Total Akhir (lunas). User bisa ubah ke 0 atau kurang = hutang. Nilai minimal 0.
        const nilaiBayar = Math.max(0, Math.min(jumlahBayarNum, totalAkhir));
        payload.jumlahBayar = Math.round(nilaiBayar);

        pendingPayloadRef.current = payload;
        openConfirmPassword({
          title: "Konfirmasi password",
          description: "Masukkan password Anda untuk melanjutkan penyimpanan pembelian.",
          onConfirm: handleConfirmAfterPassword,
        });
        return;
      } catch (error) {
        toast.error("Terjadi kesalahan saat menyimpan data");
      }
    },
  });

  const handleConfirmAfterPassword = React.useCallback(async () => {
    const payload = pendingPayloadRef.current;
    if (!payload) return;
    try {
      await onSubmit(payload);
      form.reset();
      setDetailValues([{ produkId: "", jumlah: "", harga: "", subtotal: "" }]);
      onOpenChange(false);
      pendingPayloadRef.current = null;
    } catch (err: any) {
      toast.error("Terjadi kesalahan saat menyimpan data");
    }
  }, [onSubmit, form, onOpenChange]);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
      form.reset({
        pemasokId: "__walkin__",
        catatan: "",
        createdAt: todayStr,
        detail: [{ produkId: "", jumlah: "", harga: "", subtotal: "" }],
      } as any);
      setDetailValues([{ produkId: "", jumlah: "", harga: "", subtotal: "" }]);
      setOngkosBongkarTimbang("");
      setJumlahBayar("0");
    }
  }, [open, form]);

  // Handle add detail item
  const handleAddDetail = () => {
    const newDetail = [...detailValues, { produkId: "", jumlah: "", harga: "", subtotal: "" }];
    setDetailValues(newDetail);
    form.setFieldValue("detail", newDetail as any);
  };

  // Handle remove detail item
  const handleRemoveDetail = (index: number) => {
    if (detailValues.length <= 1) {
      toast.error("Minimal 1 item pembelian");
      return;
    }
    const newDetail = detailValues.filter((_, i) => i !== index);
    setDetailValues(newDetail);
    form.setFieldValue("detail", newDetail as any);
  };

  // Handle detail change
  const handleDetailChange = (index: number, field: string, value: any) => {
    const newDetail = [...detailValues];
    newDetail[index] = { ...newDetail[index], [field]: value };

    // Calculate subtotal if jumlah or harga changed
    if (field === "jumlah" || field === "harga") {
      const jumlah = parseFloat(parseJumlah(newDetail[index].jumlah || "0")) || 0;
      const harga = parseFloat(parseCurrency(newDetail[index].harga || "0")) || 0;
      newDetail[index].subtotal = formatCurrency(jumlah * harga);
    }

    setDetailValues(newDetail);
    form.setFieldValue("detail", newDetail as any);
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 max-h-screen w-full sm:max-w-2xl">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle> 
            Tambah Pembelian
          </SheetTitle>
          <SheetDescription>
            Isi form di bawah ini untuk menambah pembelian baru
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4">
            {/* Pemasok */}
            
            <form.Field name="pemasokId">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Pemasok (Opsional)</FieldLabel>
                  <Select
                    value={field.state.value || "__walkin__"}
                    onValueChange={(value) => {
                      const newValue = value === "__walkin__" ? null : value;
                      field.handleChange(newValue);
                    }}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Pilih pemasok atau biarkan kosong untuk walk-in" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__walkin__">Walk-in (Tanpa Pemasok)</SelectItem>
                      {pemasokOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            {/* Tanggal transaksi (created_at) */}
            <form.Field name="createdAt">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Tanggal transaksi (created_at)</FieldLabel>
                  <Input
                    id={field.name}
                    type="date"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="createdAtTime">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Waktu transaksi (created_at_time)</FieldLabel>
                  <Input
                    id={field.name}
                    type="time"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            {/* <Input
          type="time"
          id="time-picker-optional"
          step="1"
          defaultValue="10:30:00"
          className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        /> */}

            {/* Detail Pembelian */}
            <form.Field name="detail">
              {(field) => (
                <Field>
                  <div className="flex items-center justify-between mb-2">
                    <FieldLabel>Detail Pembelian *</FieldLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddDetail}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {detailValues.map((item, index) => (
                      <div
                        key={`detail-${index}`}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Item {index + 1}</span>
                          {detailValues.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDetail(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Produk */}
                          <form.Field name={`detail.${index}.produkId` as any}>
                            {(produkField) => (
                              <Field>
                                <FieldLabel>Produk *</FieldLabel>
                                <Select
                                  value={item.produkId}
                                  onValueChange={(value) => {
                                    handleDetailChange(index, "produkId", value);
                                    produkField.handleChange(value);
                                    produkField.handleBlur();
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih produk" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {produkOptions.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {produkField.state.meta.isTouched &&
                                  !produkField.state.meta.isValid && (
                                    <FieldError errors={produkField.state.meta.errors} />
                                  )}
                              </Field>
                            )}
                          </form.Field>

                          {/* Jumlah */}
                          <form.Field name={`detail.${index}.jumlah` as any}>
                            {(jumlahField) => (
                              <Field>
                                <FieldLabel>Jumlah *</FieldLabel>
                                <Input
                                  type="text"
                                  placeholder="0"
                                  value={item.jumlah || ""}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^\d.]/g, "");
                                    handleDetailChange(index, "jumlah", value);
                                    jumlahField.handleChange(value);
                                  }}
                                  onBlur={() => {
                                    jumlahField.handleBlur();
                                    field.handleBlur();
                                  }}
                                />
                                {jumlahField.state.meta.isTouched &&
                                  !jumlahField.state.meta.isValid && (
                                    <FieldError errors={jumlahField.state.meta.errors} />
                                  )}
                              </Field>
                            )}
                          </form.Field>

                          {/* Harga */}
                          <form.Field name={`detail.${index}.harga` as any}>
                            {(hargaField) => (
                              <Field>
                                <FieldLabel>Harga per Satuan (Opsional)</FieldLabel>
                                <Input
                                  type="text"
                                  placeholder="Rp 0"
                                  value={item.harga || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    handleDetailChange(index, "harga", value);
                                    hargaField.handleChange(value);
                                  }}
                                  onBlur={() => {
                                    hargaField.handleBlur();
                                    field.handleBlur();
                                  }}
                                />
                              </Field>
                            )}
                          </form.Field>

                          {/* Subtotal */}
                          <Field>
                            <FieldLabel>Subtotal</FieldLabel>
                            <Input
                              type="text"
                              value={item.subtotal || ""}
                              readOnly
                              className="bg-muted"
                            />
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                  {field.state.meta.isTouched && !field.state.meta.isValid && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </Field>
              )}
            </form.Field>

            {/* Total */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold">
                  {formatCurrency(calculatedTotal)}
                </span>
              </div>
              <Field>
                <FieldLabel>Ongkos Bongkar / Timbang (Opsional)</FieldLabel>
                <Input
                  type="text"
                  placeholder="Rp 0"
                  value={ongkosBongkarTimbang}
                  onChange={(e) => setOngkosBongkarTimbang(e.target.value)}
                />
              </Field>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Total Akhir (Total − Ongkos)</span>
                <span className="font-semibold text-foreground">{formatCurrency(totalAkhir)}</span>
              </div>
              <Field>
                <FieldLabel>Jumlah Bayar *</FieldLabel>
                <Input
                  type="text"
                  placeholder={formatCurrency(totalAkhir)}
                  value={jumlahBayar || "0"}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    setJumlahBayar(raw === "" ? "0" : raw);
                  }}
                  onBlur={() => {
                    const parsed = parseFloat(parseCurrency(jumlahBayar || "0")) || 0;
                    const finalValue = Math.max(0, Math.min(parsed, totalAkhir));
                    setJumlahBayar(String(finalValue));
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default = Total Akhir (lunas). Isi 0 = tidak bayar (seluruhnya jadi hutang). Isi kurang dari Total Akhir = sisa jadi hutang (wajib pilih Pemasok).
                </p>
              </Field>
            </div>

            {/* Catatan */}
            <form.Field name="catatan">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Catatan (Opsional)</FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Masukkan catatan pembelian"
                    rows={3}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <SheetFooter className="px-6 py-4 shrink-0 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  </>
  );
}


