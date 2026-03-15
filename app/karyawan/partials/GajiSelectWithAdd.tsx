"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import { useGajis, useCreateGaji, gajiKeys } from "@/hooks/useGajis";
import { useQueryClient } from "@tanstack/react-query";
import type { FieldConfig } from "@/components/datatables/customForm";
import { Plus } from "lucide-react";

type Props = {
  field: any;
  form: any;
  fieldConfig: FieldConfig;
  isInvalid: boolean;
};

export function GajiSelectWithAdd({ field, form, fieldConfig }: Props) {
  const queryClient = useQueryClient();
  const { data: gajisData } = useGajis({ limit: 1000 });
  const createGaji = useCreateGaji();
  const [addOpen, setAddOpen] = React.useState(false);
  const [nama, setNama] = React.useState("");
  const [jumlah, setJumlah] = React.useState("");

  const gajiOptions = React.useMemo(() => {
    if (!gajisData?.data) return [];
    return gajisData.data.map((g) => ({
      value: String(g.id),
      label: g.nama,
      jumlah: g.jumlah,
    }));
  }, [gajisData]);

  const handleOpenAdd = () => {
    setNama("");
    setJumlah("");
    setAddOpen(true);
  };

  const submitAdd = async () => {
    const num = parseFloat(jumlah);
    if (!nama.trim() || Number.isNaN(num) || num <= 0) return;
    try {
      const res = await createGaji.mutateAsync({ nama: nama.trim(), jumlah: num });
      if (res?.data?.id != null) {
        const newGaji = res.data;
        const listKey = gajiKeys.list({ limit: 1000 });
        queryClient.setQueryData(listKey, (old: any) => {
          if (!old?.data) return old;
          if (old.data.some((g: { id: number }) => g.id === newGaji.id)) return old;
          return { ...old, data: [...old.data, newGaji] };
        });
        form.setFieldValue("gajiId", String(newGaji.id));
        setAddOpen(false);
      }
    } catch {
      // toast from hook
    }
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    void submitAdd();
  };

  return (
    <>
      <div className="flex gap-2">
        <Select
          value={String(field.state.value ?? "")}
          onValueChange={(value) => field.handleChange(value)}
        >
          <SelectTrigger id={field.name} className="flex-1">
            <SelectValue placeholder={fieldConfig.placeholder || "Pilih gaji"} />
          </SelectTrigger>
          <SelectContent>
            {gajiOptions.length > 0 ? (
              gajiOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label } - {formatCurrency(opt.jumlah)}/ Hari
                </SelectItem>
              ))
            ) : (
              <SelectItem value="__empty__" disabled>
                Belum ada tipe gaji
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Tambah tipe gaji"
          onClick={handleOpenAdd}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah tipe gaji</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-medium">Nama gaji</label>
              <Input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Harian"
                className="mt-1"
              />
            </div>
            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-medium">Jumlah Gaji /Hari</label>
              <div className="relative">
                <Input
                  value={formatCurrency(jumlah)}
                  onChange={(e) => setJumlah(parseCurrency(e.target.value))}
                  placeholder="0"
                  type="text"
                  autoComplete="off"
                  className="pl-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                  Rp
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Batal
              </Button>
              <Button type="button" onClick={() => void submitAdd()} disabled={createGaji.isPending}>
                {createGaji.isPending ? "Menambah..." : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
