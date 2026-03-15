import type { CreatePemasokDto, Pemasok } from "@/services/pemasokService";
import {
  useCreatePemasok,
  useUpdatePemasok,
  useDeletePemasok,
  useBatchDeletePemasoks,
} from "@/hooks/usePemasoks";

/**
 * Custom hook untuk mengelola handlers pemasok
 */
export function usePemasokHandlers() {
  const createPemasok = useCreatePemasok();
  const updatePemasok = useUpdatePemasok();
  const deletePemasok = useDeletePemasok();
  const batchDeletePemasoks = useBatchDeletePemasoks();

  const handleAdd = async (
    formData: CreatePemasokDto,
    editPemasok: Pemasok | null
  ) => {
    if (editPemasok) {
      await updatePemasok.mutateAsync({
        id: editPemasok.id,
        ...formData,
      });
    } else {
      await createPemasok.mutateAsync(formData);
    }
  };

  const handleDelete = async (id: string) => {
    await deletePemasok.mutateAsync(id);
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await batchDeletePemasoks.mutateAsync(ids as string[]);
  };

  return {
    handleAdd,
    handleDelete,
    handleBatchDelete,
    isCreating: createPemasok.isPending,
    isUpdating: updatePemasok.isPending,
    isDeleting: deletePemasok.isPending,
    isBatchDeleting: batchDeletePemasoks.isPending,
  };
}
