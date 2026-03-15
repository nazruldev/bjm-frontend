import type { CreatePekerjaDto, Pekerja } from "@/services/pekerjaService";
import {
  useCreatePekerja,
  useUpdatePekerja,
  useDeletePekerja,
  useBatchDeletePekerjas
} from "@/hooks/usePekerjas";

/**
 * Custom hook untuk mengelola handlers pekerja
 */
export function usePekerjaHandlers() {
  const createPekerja = useCreatePekerja();
  const updatePekerja = useUpdatePekerja();
  const deletePekerja = useDeletePekerja();
  const batchDeletePekerjas = useBatchDeletePekerjas();

  const handleAdd = async (
    formData: CreatePekerjaDto,
    editPekerja: Pekerja | null
  ) => {
    const payload = {
      ...formData,
      tarifPekerjaId: formData.tarifPekerjaId?.trim() || null,
    };
    if (editPekerja) {
      await updatePekerja.mutateAsync({
        id: editPekerja.id,
        ...payload,
      });
    } else {
      await createPekerja.mutateAsync(payload);
    }
  };

  const handleDelete = async (id: string) => {
    await deletePekerja.mutateAsync(id);
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await batchDeletePekerjas.mutateAsync(ids as string[]);
  };

  return {
    handleAdd,
    handleDelete,
    handleBatchDelete,
    isCreating: createPekerja.isPending,
    isUpdating: updatePekerja.isPending,
    isDeleting: deletePekerja.isPending,
    isBatchDeleting: batchDeletePekerjas.isPending,
  };
}
