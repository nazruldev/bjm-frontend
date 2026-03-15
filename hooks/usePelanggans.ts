import { useQuery } from "@tanstack/react-query";
import { pelangganService } from "@/services/pelangganService";

export function usePelanggans(params?: { search?: string; limit?: number }) {
  return useQuery({
    queryKey: ["pelanggans", params],
    queryFn: async () => pelangganService.getPelanggans(params),
  });
}
