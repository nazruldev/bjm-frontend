import type { CreateAbsensiDto, Absensi } from "@/services/absensiService";
import {
  useCreateAbsensi,
  useUpdateAbsensi,
  useDeleteAbsensi,
  useDeleteAbsensiBatch,
} from "@/hooks/useAbsensis";

/**
 * Custom hook untuk mengelola handlers absensi
 */
export function useAbsensiHandlers() {
  const createAbsensi = useCreateAbsensi();
  const updateAbsensi = useUpdateAbsensi();
  const deleteAbsensi = useDeleteAbsensi();
  const deleteAbsensiBatch = useDeleteAbsensiBatch();

  const handleAdd = async (
    formData: CreateAbsensiDto,
    editAbsensi: Absensi | null
  ) => {
    if (editAbsensi) {
      await updateAbsensi.mutateAsync({
        id: editAbsensi.id,
        data: {
          jam_masuk: formData.jam_masuk,
          jam_keluar: formData.jam_keluar,
          catatan: formData.catatan,
        },
      });
    } else {
      await createAbsensi.mutateAsync(formData);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAbsensi.mutateAsync(id);
  };

  const handleBatchDelete = async (ids: (string | number)[]) => {
    await deleteAbsensiBatch.mutateAsync(ids);
  };

  return {
    handleAdd,
    handleDelete,
    handleBatchDelete,
    isCreating: createAbsensi.isPending,
    isUpdating: updateAbsensi.isPending,
    isDeleting: deleteAbsensi.isPending,
    isBatchDeleting: deleteAbsensiBatch.isPending,
  };
}

