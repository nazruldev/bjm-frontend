import type { CreatePensortiranDto } from "@/services/pensortiranService";
import {
  useCreatePensortiran,
  useDeletePensortiran,
} from "@/hooks/usePensortirans";

/**
 * Custom hook untuk mengelola handlers pensortiran
 */
export function usePensortiranHandlers() {
  const createPensortiran = useCreatePensortiran();
  const deletePensortiran = useDeletePensortiran();

  const handleAdd = async (formData: CreatePensortiranDto) => {
    await createPensortiran.mutateAsync(formData);
  };

  const handleDelete = async (id: string) => {
    await deletePensortiran.mutateAsync(id);
  };

  return {
    handleAdd,
    handleDelete,
    isCreating: createPensortiran.isPending,
    isDeleting: deletePensortiran.isPending,
  };
}
