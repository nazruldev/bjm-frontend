import type { CreatePiutangDto, BayarPiutangDto } from "@/services/piutangService";
import {
  useCreatePiutang,
  useBayarPiutang,
  useDeletePiutang,
} from "@/hooks/usePiutangs";

/**
 * Custom hook untuk mengelola handlers piutang
 */
export function usePiutangHandlers() {
  const createPiutang = useCreatePiutang();
  const bayarPiutang = useBayarPiutang();
  const deletePiutang = useDeletePiutang();

  const handleCreate = async (formData: CreatePiutangDto) => {
    await createPiutang.mutateAsync(formData);
  };

  const handleBayar = async (formData: BayarPiutangDto) => {
    await bayarPiutang.mutateAsync(formData);
  };

  const handleDelete = async (id: string) => {
    await deletePiutang.mutateAsync(id);
  };

  return {
    handleCreate,
    handleBayar,
    handleDelete,
    isCreating: createPiutang.isPending,
    isBayar: bayarPiutang.isPending,
    isDeleting: deletePiutang.isPending,
  };
}

