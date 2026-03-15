import type { CreatePembelianDto } from "@/services/pembelianService";
import {
  useCreatePembelian,
  useDeletePembelian,
} from "@/hooks/usePembelians";

/**
 * Custom hook untuk mengelola handlers pembelian
 */
export function usePembelianHandlers() {
  const createPembelian = useCreatePembelian();
  const deletePembelian = useDeletePembelian();

  const handleAdd = async (
    formData: CreatePembelianDto
  ): Promise<{ id: string } | undefined> => {
    const result = await createPembelian.mutateAsync(formData) as {
      data?: { id: string; pembelian?: { id: string }; pendingApprovalId?: string };
      id?: string;
    };
    // Normal response: data = pembelian; cashless: data = { pendingApprovalId, pembelian }
    const id = result?.data?.pembelian?.id ?? result?.data?.id ?? result?.id;
    return id ? { id } : undefined;
  };

  const handleDelete = async (id: string) => {
    await deletePembelian.mutateAsync(id);
  };

  return {
    handleAdd,
    handleDelete,
    isCreating: createPembelian.isPending,
    isDeleting: deletePembelian.isPending,
  };
}



