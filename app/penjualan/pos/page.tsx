"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useProduks } from "@/hooks/useProduks";
import { usePenjualanHandlers } from "../partials/handlers";
import { PenjualanPOS } from "../partials/penjualanPOS";

import { mutasiStokService } from "@/services/mutasiStokService";

export default function PenjualanPOSPage() {
  const router = useRouter();
  const { handleAdd, isCreating } = usePenjualanHandlers();

  const { data: produkData, isLoading: isLoadingProduk } = useProduks({
    limit: 1000,
  });

  const { data: stokData } = useQuery({
    queryKey: ["mutasi-stok", "produk-grouped", 1000],
    queryFn: () => mutasiStokService.getProdukWithStok({ limit: 1000 } as any),
    staleTime: 2 * 60 * 1000,
  });

  const produkListForPOS = React.useMemo(() => {
    if (!produkData?.data) return [];
    return produkData.data.filter((p) => p.bisa_dijual);
  }, [produkData]);

  const stokByProdukId = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (stokData?.data) {
      for (const item of stokData.data) {
        map[item.id] = item.stok?.saldoAkhir ?? 0;
      }
    }
    return map;
  }, [stokData]);

  const handleSubmit = async (formData: Parameters<typeof handleAdd>[0]) => {
    try {
      const created = await handleAdd(formData);
      if (created?.id) router.push(`/penjualan/${created.id}`);
      else router.push("/penjualan");
    } catch (e) {
      console.error("Error in handleSubmit:", e);
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
    <div className="space-y-4">
      <div className="flex items-center gap-4">
      
        <div>
          <h1 className="text-2xl font-bold">POS Penjualan</h1>
          <p className="text-muted-foreground">
            Buat penjualan baru 
          </p>
        </div>
      </div>

      <PenjualanPOS
        produkList={produkListForPOS}
        stokByProdukId={stokByProdukId}
        onSubmit={handleSubmit}
        isLoading={isCreating}
      />
    </div>
  );
}
