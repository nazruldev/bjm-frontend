"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useProduks } from "@/hooks/useProduks";
import { usePemasoks, useCreatePemasok } from "@/hooks/usePemasoks";
import { useRekenings } from "@/hooks/useRekenings";
import { usePembelianHandlers } from "../partials/handlers";
import { PembelianPOS } from "../partials/pembelianPOS";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CreatePemasokDto } from "@/services/pemasokService";

export default function PembelianPOSPage() {
  const router = useRouter();
  const { handleAdd: handleAddPembelian, isCreating } = usePembelianHandlers();
  const createPemasok = useCreatePemasok();

  // Fetch produk untuk POS (hanya yang bisa dibeli)
  const { data: produkData, isLoading: isLoadingProduk } = useProduks({ limit: 1000 });

  // Fetch pemasok dari service pemasok
  const { data: pemasokData } = usePemasoks({ limit: 1000 });

  // Fetch rekening untuk cashless
  const { data: rekeningData } = useRekenings({ limit: 1000, isActive: true });

  // Filter produk untuk POS (hanya yang bisa dibeli)
  const produkListForPOS = React.useMemo(() => {
    if (!produkData?.data) return [];
    return produkData.data.filter((p) => p.bisa_dibeli);
  }, [produkData]);

  // Prepare pemasok options
  const pemasokOptions = React.useMemo(() => {
    if (!pemasokData?.data) return [];
    return pemasokData.data.map((p) => ({
      value: p.id,
      label: p.nama,
    }));
  }, [pemasokData]);

  // Prepare rekening options
  const rekeningOptions = React.useMemo(() => {
    if (!rekeningData?.data) return [];
    return rekeningData.data.map((r) => ({
      value: r.id,
      label: `${r.bank} - ${r.nama}${r.nomor ? ` (${r.nomor})` : ""}`,
    }));
  }, [rekeningData]);

  const handleQuickAddPemasok = React.useCallback(
    async (data: CreatePemasokDto) => {
      const res = await createPemasok.mutateAsync(data);
      const id = (res as any)?.data?.id ?? (res as any)?.id;
      if (!id) throw new Error("Pemasok dibuat tetapi ID tidak ditemukan");
      return { id };
    },
    [createPemasok]
  );

  const handleSubmit = async (formData: any) => {
    try {
      const { metodePembayaran, ...pembelianData } = formData;
      const created = await handleAddPembelian(pembelianData);
      if (created?.id) {
        router.push(`/pembelian/${created.id}`);
      } else {
        router.push("/pembelian");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error?.message ?? "Gagal menyimpan pembelian";
      console.error("Error in handleSubmit:", error);
      toast.error(msg);
    }
  };

  if (isLoadingProduk) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-h-0 flex-1 lg:min-h-[calc(100vh-10rem)]">
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">POS Pembelian</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Buat pembelian baru
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 flex flex-col">
        <PembelianPOS
        produkList={produkListForPOS}
        pemasokOptions={pemasokOptions}
        onQuickAddPemasok={handleQuickAddPemasok}
        rekeningOptions={rekeningOptions}
        onSubmit={handleSubmit}
        isLoading={isCreating}
        />
      </div>
    </div>
  );
}

