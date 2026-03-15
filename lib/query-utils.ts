"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

/**
 * Hook untuk mendapatkan query client dan helper functions untuk invalidate/refetch
 * Bisa digunakan di komponen manapun untuk refetch queries dari halaman lain
 * 
 * @example
 * ```tsx
 * // Di komponen manapun
 * const { refetchQueries, invalidateQueries, refetchMultipleQueries } = useQueryUtils();
 * 
 * // Menggunakan string key (lebih sederhana)
 * await refetchQueries("piutang"); // Refetch semua queries yang dimulai dengan ["piutang"]
 * await refetchQueries("pending"); // Refetch semua queries yang dimulai dengan ["piutang", "pending"]
 * 
 * // Refetch multiple queries sekaligus dengan string keys
 * await refetchMultipleQueries(["piutang", "karyawan", "pending"]);
 * 
 * // Atau masih bisa menggunakan QueryKey
 * await refetchQueries(piutangKeys.lists());
 * 
 * // Invalidate (akan auto refetch jika query sedang digunakan)
 * await invalidateQueries("piutang");
 * ```
 */
export function useQueryUtils() {
  const queryClient = useQueryClient();

  /**
   * Invalidate queries berdasarkan query key atau nama key (string)
   * Query akan di-mark sebagai stale dan akan di-refetch otomatis jika sedang digunakan
   * 
   * @param keys - QueryKey, string key, atau multiple string keys seperti "piutang", "pending"
   * @param options - Optional options untuk invalidate
   * @example
   * ```tsx
   * // Menggunakan single string key
   * await invalidateQueries("piutang"); // Akan invalidate semua queries yang dimulai dengan ["piutang"]
   * 
   * // Menggunakan multiple string keys
   * await invalidateQueries("piutang", "pending"); // Akan invalidate queries dengan key ["piutang", "pending"]
   * 
   * // Menggunakan QueryKey
   * await invalidateQueries(piutangKeys.lists());
   * 
   * // Dengan options
   * await invalidateQueries("piutang", { exact: true });
   * ```
   */
  const invalidateQueries = async (
    ...args: (QueryKey | string | { exact?: boolean; refetchType?: "active" | "inactive" | "all" | "none" })[]
  ) => {
    let options: { exact?: boolean; refetchType?: "active" | "inactive" | "all" | "none" } = { exact: false, refetchType: "active" };
    const keys: (QueryKey | string)[] = [];

    // Extract options if last arg is options object
    for (const arg of args) {
      if (typeof arg === "object" && arg !== null && !Array.isArray(arg) && ("exact" in arg || "refetchType" in arg)) {
        options = arg as typeof options;
      } else {
        keys.push(arg as QueryKey | string);
      }
    }

    // Build query key from keys
    const queryKey: QueryKey = keys.length === 1
      ? (typeof keys[0] === "string" ? [keys[0]] : keys[0])
      : keys.every((k) => typeof k === "string")
      ? keys as string[]
      : keys[0] as QueryKey;

    await queryClient.invalidateQueries({
      queryKey,
      exact: options.exact ?? false,
      refetchType: options.refetchType ?? "active",
    });
  };

  /**
   * Refetch queries berdasarkan query key atau nama key (string)
   * Langsung melakukan refetch tanpa menunggu query digunakan
   * 
   * @param keys - QueryKey, string key, atau multiple string keys seperti "piutang", "pending"
   * @param options - Optional options untuk refetch
   * @example
   * ```tsx
   * // Menggunakan single string key
   * await refetchQueries("piutang"); // Akan refetch semua queries yang dimulai dengan ["piutang"]
   * 
   * // Menggunakan multiple string keys
   * await refetchQueries("piutang", "pending"); // Akan refetch queries dengan key ["piutang", "pending"]
   * 
   * // Menggunakan QueryKey
   * await refetchQueries(piutangKeys.lists());
   * 
   * // Dengan options
   * await refetchQueries("piutang", { exact: true });
   * ```
   */
  const refetchQueries = async (
    ...args: (QueryKey | string | { exact?: boolean; type?: "active" | "inactive" | "all" })[]
  ) => {
    let options: { exact?: boolean; type?: "active" | "inactive" | "all" } = { exact: false, type: "active" };
    const keys: (QueryKey | string)[] = [];

    // Extract options if last arg is options object
    for (const arg of args) {
      if (typeof arg === "object" && arg !== null && !Array.isArray(arg) && ("exact" in arg || "type" in arg)) {
        options = arg as typeof options;
      } else {
        keys.push(arg as QueryKey | string);
      }
    }

    // Build query key from keys
    const queryKey: QueryKey = keys.length === 1
      ? (typeof keys[0] === "string" ? [keys[0]] : keys[0])
      : keys.every((k) => typeof k === "string")
      ? keys as string[]
      : keys[0] as QueryKey;

    await queryClient.refetchQueries({
      queryKey,
      exact: options.exact ?? false,
      type: options.type ?? "active",
    });
  };

  /**
   * Remove queries dari cache
   * @param key - QueryKey atau string key seperti "piutang", "karyawan"
   */
  const removeQueries = (
    key: QueryKey | string,
    options?: { exact?: boolean }
  ) => {
    const queryKey = typeof key === "string" ? [key] : key;
    queryClient.removeQueries({
      queryKey,
      exact: options?.exact ?? false,
    });
  };

  /**
   * Reset queries ke initial state
   * @param key - QueryKey atau string key seperti "piutang", "karyawan"
   */
  const resetQueries = async (
    key: QueryKey | string,
    options?: {
      exact?: boolean;
    }
  ) => {
    const queryKey = typeof key === "string" ? [key] : key;
    await queryClient.resetQueries({
      queryKey,
      exact: options?.exact ?? false,
    });
  };

  /**
   * Invalidate multiple queries sekaligus
   * @param keys Array of query keys atau string keys yang akan di-invalidate
   * @example
   * ```tsx
   * await invalidateMultipleQueries(["piutang", "karyawan", "pending"]);
   * ```
   */
  const invalidateMultipleQueries = async (
    keys: (QueryKey | string)[],
    options?: {
      exact?: boolean;
      refetchType?: "active" | "inactive" | "all" | "none";
    }
  ) => {
    await Promise.all(
      keys.map((key) => {
        const queryKey = typeof key === "string" ? [key] : key;
        return queryClient.invalidateQueries({
          queryKey,
          exact: options?.exact ?? false,
          refetchType: options?.refetchType ?? "active",
        });
      })
    );
  };

  /**
   * Refetch multiple queries sekaligus
   * @param keys Array of query keys atau string keys yang akan di-refetch
   * @example
   * ```tsx
   * await refetchMultipleQueries(["piutang", "karyawan", "pending"]);
   * ```
   */
  const refetchMultipleQueries = async (
    keys: (QueryKey | string)[],
    options?: {
      exact?: boolean;
      type?: "active" | "inactive" | "all";
    }
  ) => {
    await Promise.all(
      keys.map((key) => {
        const queryKey = typeof key === "string" ? [key] : key;
        return queryClient.refetchQueries({
          queryKey,
          exact: options?.exact ?? false,
          type: options?.type ?? "active",
        });
      })
    );
  };

  /**
   * Remove multiple queries dari cache sekaligus
   * @param keys Array of query keys atau string keys yang akan di-remove
   */
  const removeMultipleQueries = (
    keys: (QueryKey | string)[],
    options?: { exact?: boolean }
  ) => {
    keys.forEach((key) => {
      const queryKey = typeof key === "string" ? [key] : key;
      queryClient.removeQueries({
        queryKey,
        exact: options?.exact ?? false,
      });
    });
  };

  /**
   * Reset multiple queries ke initial state sekaligus
   * @param keys Array of query keys atau string keys yang akan di-reset
   */
  const resetMultipleQueries = async (
    keys: (QueryKey | string)[],
    options?: {
      exact?: boolean;
    }
  ) => {
    await Promise.all(
      keys.map((key) => {
        const queryKey = typeof key === "string" ? [key] : key;
        return queryClient.resetQueries({
          queryKey,
          exact: options?.exact ?? false,
        });
      })
    );
  };

  return {
    queryClient,
    invalidateQueries,
    refetchQueries,
    removeQueries,
    resetQueries,
    invalidateMultipleQueries,
    refetchMultipleQueries,
    removeMultipleQueries,
    resetMultipleQueries,
  };
}

/**
 * Helper function untuk invalidate queries tanpa hook
 * Harus dipanggil dengan queryClient dari useQueryClient()
 */
export const queryUtils = {
  /**
   * Invalidate queries berdasarkan query key atau string key
   */
  invalidate: (
    queryClient: ReturnType<typeof useQueryClient>,
    key: QueryKey | string,
    options?: {
      exact?: boolean;
      refetchType?: "active" | "inactive" | "all" | "none";
    }
  ) => {
    const queryKey = typeof key === "string" ? [key] : key;
    return queryClient.invalidateQueries({
      queryKey,
      exact: options?.exact ?? false,
      refetchType: options?.refetchType ?? "active",
    });
  },

  /**
   * Refetch queries berdasarkan query key atau string key
   */
  refetch: (
    queryClient: ReturnType<typeof useQueryClient>,
    key: QueryKey | string,
    options?: {
      exact?: boolean;
      type?: "active" | "inactive" | "all";
    }
  ) => {
    const queryKey = typeof key === "string" ? [key] : key;
    return queryClient.refetchQueries({
      queryKey,
      exact: options?.exact ?? false,
      type: options?.type ?? "active",
    });
  },

  /**
   * Remove queries dari cache
   */
  remove: (
    queryClient: ReturnType<typeof useQueryClient>,
    key: QueryKey | string,
    options?: { exact?: boolean }
  ) => {
    const queryKey = typeof key === "string" ? [key] : key;
    return queryClient.removeQueries({
      queryKey,
      exact: options?.exact ?? false,
    });
  },

  /**
   * Reset queries ke initial state
   */
  reset: (
    queryClient: ReturnType<typeof useQueryClient>,
    key: QueryKey | string,
    options?: { exact?: boolean }
  ) => {
    const queryKey = typeof key === "string" ? [key] : key;
    return queryClient.resetQueries({
      queryKey,
      exact: options?.exact ?? false,
    });
  },

  /**
   * Invalidate multiple queries sekaligus
   */
  invalidateMultiple: (
    queryClient: ReturnType<typeof useQueryClient>,
    keys: (QueryKey | string)[],
    options?: {
      exact?: boolean;
      refetchType?: "active" | "inactive" | "all" | "none";
    }
  ) => {
    return Promise.all(
      keys.map((key) => {
        const queryKey = typeof key === "string" ? [key] : key;
        return queryClient.invalidateQueries({
          queryKey,
          exact: options?.exact ?? false,
          refetchType: options?.refetchType ?? "active",
        });
      })
    );
  },

  /**
   * Refetch multiple queries sekaligus
   */
  refetchMultiple: (
    queryClient: ReturnType<typeof useQueryClient>,
    keys: (QueryKey | string)[],
    options?: {
      exact?: boolean;
      type?: "active" | "inactive" | "all";
    }
  ) => {
    return Promise.all(
      keys.map((key) => {
        const queryKey = typeof key === "string" ? [key] : key;
        return queryClient.refetchQueries({
          queryKey,
          exact: options?.exact ?? false,
          type: options?.type ?? "active",
        });
      })
    );
  },

  /**
   * Remove multiple queries dari cache sekaligus
   */
  removeMultiple: (
    queryClient: ReturnType<typeof useQueryClient>,
    keys: (QueryKey | string)[],
    options?: { exact?: boolean }
  ) => {
    keys.forEach((key) => {
      const queryKey = typeof key === "string" ? [key] : key;
      queryClient.removeQueries({
        queryKey,
        exact: options?.exact ?? false,
      });
    });
  },

  /**
   * Reset multiple queries ke initial state sekaligus
   */
  resetMultiple: (
    queryClient: ReturnType<typeof useQueryClient>,
    keys: (QueryKey | string)[],
    options?: { exact?: boolean }
  ) => {
    return Promise.all(
      keys.map((key) => {
        const queryKey = typeof key === "string" ? [key] : key;
        return queryClient.resetQueries({
          queryKey,
          exact: options?.exact ?? false,
        });
      })
    );
  },
};

