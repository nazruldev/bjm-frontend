import type { CreateRekeningDto, Rekening } from "@/services/rekeningService";
import {
  useCreateRekening,
  useUpdateRekening,
  useDeleteRekening,
  useBatchDeleteRekenings,
} from "@/hooks/useRekenings";

/**
 * Custom hook untuk mengelola handlers rekening
 */
export function useRekeningHandlers() {
  const createRekening = useCreateRekening();
  const updateRekening = useUpdateRekening();
  const deleteRekening = useDeleteRekening();
  const batchDeleteRekenings = useBatchDeleteRekenings();

  const handleAdd = async (
    formData: CreateRekeningDto,
    editRekening: Rekening | null
  ) => {
    if (editRekening) {
      await updateRekening.mutateAsync({
        id: editRekening.id,
        ...formData,
      });
    } else {
      await createRekening.mutateAsync(formData);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRekening.mutateAsync(id);
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await batchDeleteRekenings.mutateAsync(ids as string[]);
  };

  return {
    handleAdd,
    handleDelete,
    handleBatchDelete,
    isCreating: createRekening.isPending,
    isUpdating: updateRekening.isPending,
    isDeleting: deleteRekening.isPending,
    isBatchDeleting: batchDeleteRekenings.isPending,
  };
}