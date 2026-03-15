import type { CreateKaryawanDto, Karyawan } from "@/services/karyawanService";
import {
  useCreateKaryawan,
  useUpdateKaryawan,
  useDeleteKaryawan,
} from "@/hooks/useKaryawans";

/**
 * Custom hook untuk mengelola handlers karyawan
 */
export function useKaryawanHandlers() {
  const createKaryawan = useCreateKaryawan();
  const updateKaryawan = useUpdateKaryawan();
  const deleteKaryawan = useDeleteKaryawan();

  const handleAdd = async (
    formData: CreateKaryawanDto,
    editKaryawan: Karyawan | null
  ): Promise<{ data?: Karyawan; message?: string } | void> => {
    if (editKaryawan) {
      await updateKaryawan.mutateAsync({
        id: editKaryawan.id,
        ...formData,
      });
    } else {
      const res = await createKaryawan.mutateAsync(formData);
      return res as { data?: Karyawan; message?: string };
    }
  };

  const handleDelete = async (id: string) => {
    await deleteKaryawan.mutateAsync(id);
  };

  return {
    handleAdd,
    handleDelete,
    isCreating: createKaryawan.isPending,
    isUpdating: updateKaryawan.isPending,
    isDeleting: deleteKaryawan.isPending,
  };
}