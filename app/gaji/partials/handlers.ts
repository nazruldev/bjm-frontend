import type { CreateGajiDto, Gaji } from "@/services/gajiService";
import {
  useCreateGaji,
  useUpdateGaji,
  useDeleteGaji,
  useBatchDeleteGajis,
} from "@/hooks/useGajis";

/**
 * Custom hook untuk mengelola handlers gaji
 */
export function useGajiHandlers() {
  const createGaji = useCreateGaji();
  const updateGaji = useUpdateGaji();
  const deleteGaji = useDeleteGaji();
  const batchDeleteGajis = useBatchDeleteGajis();

  const handleAdd = async (
    formData: CreateGajiDto,
    editGaji: Gaji | null
  ) => {
    if (editGaji) {
      // Update gaji
      await updateGaji.mutateAsync({
        id: editGaji.id,
        ...formData,
      });
    } else {
      // Create gaji baru
      await createGaji.mutateAsync(formData);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteGaji.mutateAsync(id);
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await batchDeleteGajis.mutateAsync(ids);
  };

  return {
    handleAdd,
    handleDelete,
    handleBatchDelete,
    isCreating: createGaji.isPending,
    isUpdating: updateGaji.isPending,
    isDeleting: deleteGaji.isPending,
    isBatchDeleting: batchDeleteGajis.isPending,
  };
}

