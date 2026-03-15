import { useDeletePiutang } from "@/hooks/usePiutangs";

/**
 * Custom hook untuk mengelola handlers piutang detail
 */
export function usePiutangDetailHandlers() {
  const deletePiutang = useDeletePiutang();

  const handleDelete = async (id: string) => {
    await deletePiutang.mutateAsync(id);
  };

  return {
    handleDelete,
    isDeleting: deletePiutang.isPending,
  };
}

