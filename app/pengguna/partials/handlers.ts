import type { CreatePenggunaDto, Pengguna } from "@/services/penggunaService";
import {
  useCreatePengguna,
  useUpdatePengguna,
  useDeletePengguna,
  useBatchDeletePenggunas,
} from "@/hooks/usePenggunas";

/**
 * Custom hook untuk mengelola handlers pengguna
 */
export function usePenggunaHandlers() {
  const createPengguna = useCreatePengguna();
  const updatePengguna = useUpdatePengguna();
  const deletePengguna = useDeletePengguna();
  const batchDeletePenggunas = useBatchDeletePenggunas();

  const handleAdd = async (
    formData: CreatePenggunaDto,
    editPengguna: Pengguna | null
  ) => {
    // Import NO_OUTLET_VALUE
    const NO_OUTLET_VALUE = "__none__";
    
    // Transform outletId: NO_OUTLET_VALUE to null, otherwise keep as is
    const transformedData: any = {
      ...formData,
      outletId: formData.outletId === NO_OUTLET_VALUE ? null : formData.outletId,
    };
    
    if (editPengguna) {
      // Untuk update, jika password kosong, hapus dari data
      const updateData: any = { ...transformedData };
      if (!updateData.password || updateData.password === "") {
        delete updateData.password;
      }
      await updatePengguna.mutateAsync({
        id: editPengguna.id,
        ...updateData,
      });
    } else {
      await createPengguna.mutateAsync(transformedData);
    }
  };

  const handleDelete = async (id: string) => {
    await deletePengguna.mutateAsync(id);
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await batchDeletePenggunas.mutateAsync(ids as string[]);
  };

  return {
    handleAdd,
    handleDelete,
    handleBatchDelete,
    isCreating: createPengguna.isPending,
    isUpdating: updatePengguna.isPending,
    isDeleting: deletePengguna.isPending,
    isBatchDeleting: batchDeletePenggunas.isPending,
  };
}