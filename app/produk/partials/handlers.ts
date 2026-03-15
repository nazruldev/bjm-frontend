import type { CreateProdukDto, Produk } from "@/services/produkService";
import {
  useCreateProduk,
  useUpdateProduk,
  useDeleteProduk,
  useBatchDeleteProduks,
} from "@/hooks/useProduks";

/**
 * Custom hook untuk mengelola handlers produk
 */
export function useProdukHandlers() {
  const createProduk = useCreateProduk();
  const updateProduk = useUpdateProduk();
  const deleteProduk = useDeleteProduk();
  const batchDeleteProduks = useBatchDeleteProduks();

  const handleAdd = async (
    formData: CreateProdukDto,
    editProduk: Produk | null
  ) => {
    const payload = {
      ...formData,
      isInput: (formData as any).isInput ?? false,
      isOutput: (formData as any).isOutput ?? false,
    };
    if (editProduk) {
      if (editProduk.isPermanent) {
        delete (payload as any).nama_produk;
      }
      await updateProduk.mutateAsync({
        id: editProduk.id,
        ...payload,
      });
    } else {
      await createProduk.mutateAsync(payload);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProduk.mutateAsync(id);
  };

  const handleBatchDelete = async (ids: (number | string)[]) => {
    await batchDeleteProduks.mutateAsync(ids as string[]);
  };

  return {
    handleAdd,
    handleDelete,
    handleBatchDelete,
    isCreating: createProduk.isPending,
    isUpdating: updateProduk.isPending,
    isDeleting: deleteProduk.isPending,
    isBatchDeleting: batchDeleteProduks.isPending,
  };
}
