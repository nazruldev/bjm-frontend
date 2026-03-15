import { useDeleteHutang } from "@/hooks/useHutangs";

/**
 * Custom hook untuk mengelola handlers hutang detail
 */
export function useHutangDetailHandlers() {
  const deleteHutang = useDeleteHutang();

  const handleDelete = async (id: string) => {
    await deleteHutang.mutateAsync(id);
  };

  return {
    handleDelete,
    isDeleting: deleteHutang.isPending,
  };
}

