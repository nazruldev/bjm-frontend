import type { BayarHutangDto } from "@/services/hutangService";
import {
  useBayarHutang,
  useDeleteHutang,
} from "@/hooks/useHutangs";

/**
 * Custom hook untuk mengelola handlers hutang
 */
export function useHutangHandlers() {
  const bayarHutang = useBayarHutang();
  const deleteHutang = useDeleteHutang();

  const handleBayar = async (formData: BayarHutangDto) => {
    await bayarHutang.mutateAsync(formData);
  };

  const handleDelete = async (id: string) => {
    await deleteHutang.mutateAsync(id);
  };

  return {
    handleBayar,
    handleDelete,
    isBayar: bayarHutang.isPending,
    isDeleting: deleteHutang.isPending,
  };
}

