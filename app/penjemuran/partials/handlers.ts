import type { CreatePenjemuranDto } from "@/services/penjemuranService";
import {
  useCreatePenjemuran,
  useDeletePenjemuran,
} from "@/hooks/usePenjemurans";

/**
 * Custom hook untuk mengelola handlers penjemuran
 */
export function usePenjemuranHandlers() {
  const createPenjemuran = useCreatePenjemuran();
  const deletePenjemuran = useDeletePenjemuran();

  const handleAdd = async (formData: CreatePenjemuranDto) => {
    await createPenjemuran.mutateAsync(formData);
  };

  const handleDelete = async (id: string) => {
    await deletePenjemuran.mutateAsync(id);
  };

  return {
    handleAdd,
    handleDelete,
    isCreating: createPenjemuran.isPending,
    isDeleting: deletePenjemuran.isPending,
  };
}               

