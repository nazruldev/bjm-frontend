"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dengan SSR, kita biasanya ingin set default staleTime lebih tinggi
            // untuk menghindari refetching segera setelah mount
            staleTime: 60 * 1000, // 1 menit
            gcTime: 5 * 60 * 1000, // 5 menit (sebelumnya cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

