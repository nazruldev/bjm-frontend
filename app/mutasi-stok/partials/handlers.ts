import type { CreateMutasiStokDto, MutasiStok } from "@/services/mutasiStokService";
import {
  useCreateMutasiStok,
  useUpdateMutasiStok,
  useDeleteMutasiStok,
} from "@/hooks/useMutasiStoks";
import { toLocalDateStringOnly, parseJumlahID } from "@/lib/utils";

/**
 * Custom hook untuk mengelola handlers mutasi stok
 */
export function useMutasiStokHandlers() {
  const createMutasiStok = useCreateMutasiStok();
  const updateMutasiStok = useUpdateMutasiStok();
  const deleteMutasiStok = useDeleteMutasiStok();

  const handleAdd = async (
    formData: CreateMutasiStokDto,
    editMutasiStok: MutasiStok | null
  ) => {
    // Normalisasi jumlah: dari input format id-ID (1.000 = 1000) ke number
    const jumlah =
      typeof formData.jumlah === "string"
        ? parseJumlahID(formData.jumlah)
        : Number(formData.jumlah);

    const payload = {
      ...formData,
      jumlah,
      tanggal:
        formData.tanggal instanceof Date
          ? toLocalDateStringOnly(formData.tanggal)
          : formData.tanggal,
    };

    if (editMutasiStok) {
      await updateMutasiStok.mutateAsync({
        id: editMutasiStok.id,
        ...payload,
      });
    } else {
      await createMutasiStok.mutateAsync(payload);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutasiStok.mutateAsync(id);
  };

  return {
    handleAdd,
    handleDelete,
    isCreating: createMutasiStok.isPending,
    isUpdating: updateMutasiStok.isPending,
    isDeleting: deleteMutasiStok.isPending,
  };
}

