import type { CreatePenjualanDto } from "@/services/penjualanService";
import {
  useCreatePenjualan,
  useDeletePenjualan,
} from "@/hooks/usePenjualans";

export function usePenjualanHandlers() {
  const createPenjualan = useCreatePenjualan();
  const deletePenjualan = useDeletePenjualan();

  const handleAdd = async (
    formData: CreatePenjualanDto
  ): Promise<{ id: string } | undefined> => {
    const result = await createPenjualan.mutateAsync(formData) as { id?: string };
    return result?.id ? { id: result.id } : undefined;
  };

  const handleDelete = async (id: string) => {
    await deletePenjualan.mutateAsync(id);
  };

  return {
    handleAdd,
    handleDelete,
    isCreating: createPenjualan.isPending,
    isDeleting: deletePenjualan.isPending,
  };
}
