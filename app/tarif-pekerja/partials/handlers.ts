import type {
  CreateTarifPekerjaDto,
  TarifPekerjaItem,
} from "@/services/tarifPekerjaService";
import {
  useCreateTarifPekerja,
  useUpdateTarifPekerja,
  useDeleteTarifPekerja,
} from "@/hooks/useTarifPekerja";

export function useTarifPekerjaHandlers() {
  const createTarif = useCreateTarifPekerja();
  const updateTarif = useUpdateTarifPekerja();
  const deleteTarif = useDeleteTarifPekerja();

  const handleAdd = async (
    formData: CreateTarifPekerjaDto,
    editItem: TarifPekerjaItem | null
  ) => {
    if (editItem) {
      await updateTarif.mutateAsync({
        id: editItem.id,
        nama: formData.nama ?? null,
        tipe: formData.tipe,
        tarifPerKg: formData.tarifPerKg,
      });
    } else {
      await createTarif.mutateAsync({
        nama: formData.nama ?? null,
        tipe: formData.tipe,
        tarifPerKg: formData.tarifPerKg,
      });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTarif.mutateAsync(id);
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    for (const id of ids) {
      await deleteTarif.mutateAsync(String(id));
    }
  };

  return {
    handleAdd,
    handleDelete,
    handleBatchDelete,
  };
}
