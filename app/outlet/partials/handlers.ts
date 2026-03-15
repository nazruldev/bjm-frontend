import type { CreateOutletDto, Outlet } from "@/services/outletService";
import {
  useCreateOutlet,
  useUpdateOutlet,
  useDeleteOutlet,
  useBatchDeleteOutlets,
} from "@/hooks/useOutlets";

/**
 * Custom hook untuk mengelola handlers outlet
 */
export function useOutletHandlers() {
  const createOutlet = useCreateOutlet();
  const updateOutlet = useUpdateOutlet();
  const deleteOutlet = useDeleteOutlet();
  const batchDeleteOutlets = useBatchDeleteOutlets();

  const handleAdd = async (
    formData: CreateOutletDto,
    editOutlet: Outlet | null
  ) => {
    if (editOutlet) {
      // Update outlet
      await updateOutlet.mutateAsync({
        id: editOutlet.id,
        ...formData,
      });
    } else {
      // Create outlet
      await createOutlet.mutateAsync(formData);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteOutlet.mutateAsync(id);
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await batchDeleteOutlets.mutateAsync(ids as string[]);
  };

  return {
    handleAdd,
    handleDelete,
    handleBatchDelete,
    isCreating: createOutlet.isPending,
    isUpdating: updateOutlet.isPending,
    isDeleting: deleteOutlet.isPending,
    isBatchDeleting: batchDeleteOutlets.isPending,
  };
}

