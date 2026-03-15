import type { CreatePengupasanDto } from "@/services/pengupasanService";
import {
  useCreatePengupasan,
  useDeletePengupasan,
} from "@/hooks/usePengupasans";

/**
 * Custom hook untuk mengelola handlers pengupasan
 */
export function usePengupasanHandlers() {
  const createPengupasan = useCreatePengupasan();
  const deletePengupasan = useDeletePengupasan();

  const handleAdd = async (formData: CreatePengupasanDto) => {
    await createPengupasan.mutateAsync(formData);
  };

  const handleDelete = async (id: string) => {
    await deletePengupasan.mutateAsync(id);
  };

  return {
    handleAdd,
    handleDelete,
    isCreating: createPengupasan.isPending,
    isDeleting: deletePengupasan.isPending,
  };
}               
