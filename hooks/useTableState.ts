"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useEffect, useRef } from "react";

interface UseTableStateOptions {
  defaultPageSize?: number;
  excludeParams?: string[];
}

export function useTableState(options: UseTableStateOptions = {}) {
  const { defaultPageSize = 10, excludeParams = [] } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Ref untuk track apakah update berasal dari internal (handlers) atau external (URL change)
  const isInternalUpdate = useRef(false);
  const lastSearchString = useRef<string>("");

  // Parse initial state dari URL
  const getInitialPagination = useCallback(() => {
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");
    return {
      pageIndex: page ? parseInt(page, 10) - 1 : 0,
      pageSize: pageSize ? parseInt(pageSize, 10) : defaultPageSize,
    };
  }, [searchParams, defaultPageSize]);

  const getInitialFilters = useCallback(() => {
    const filters: Record<string, any> = {};
    const excludeKeys = ["page", "pageSize", ...excludeParams];
    
    searchParams.forEach((value, key) => {
      if (!excludeKeys.includes(key) && value) {
        // Try to parse JSON for complex values (objects, arrays)
        try {
          const parsed = JSON.parse(value);
          filters[key] = parsed;
        } catch {
          // If not JSON, use as string
          filters[key] = value;
        }
      }
    });
    return filters;
  }, [searchParams, excludeParams]);

  const [pagination, setPagination] = useState(() => getInitialPagination());
  const [filters, setFilters] = useState<Record<string, any>>(() => getInitialFilters());

  // Update URL helper
  const updateURL = useCallback(
    (newPagination: typeof pagination, newFilters: typeof filters) => {
      const params = new URLSearchParams();

      // Tulis pagination ke URL
      if (newPagination.pageIndex > 0) {
        params.set("page", String(newPagination.pageIndex + 1));
      }
      if (newPagination.pageSize !== defaultPageSize) {
        params.set("pageSize", String(newPagination.pageSize));
      }

      // Tulis semua filter ke URL sebagai query parameter (kecuali yang di-exclude)
      Object.entries(newFilters).forEach(([key, value]) => {
        // Skip key yang ada di excludeParams (misalnya tanggal di absensi)
        // Pastikan excludeParams benar-benar mengecualikan key ini
        if (excludeParams && excludeParams.includes(key)) {
          return;
        }

        // Tulis filter ke URL jika ada nilai
        if (value !== undefined && value !== null && value !== "") {
          // Serialize objects and arrays to JSON, keep primitives as string
          if (typeof value === "object" || Array.isArray(value)) {
            try {
              params.set(key, JSON.stringify(value));
            } catch {
              // Skip if can't serialize
            }
          } else {
            // Tulis sebagai string query parameter (seperti search)
            params.set(key, String(value));
          }
        }
      });

      // Pastikan parameter yang di-exclude tidak ada di URL (hapus jika ada)
      if (excludeParams && excludeParams.length > 0) {
        excludeParams.forEach((excludedKey) => {
          // Hapus parameter yang di-exclude dari URL
          params.delete(excludedKey);
        });
      }

      // Mark sebagai internal update sebelum mengubah URL
      isInternalUpdate.current = true;
      router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, {
        scroll: false,
      });
    },
    [router, pathname, defaultPageSize, excludeParams]
  );

  // Sync state dengan URL saat searchParams berubah (hanya jika bukan internal update)
  const searchString = searchParams.toString();
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (lastSearchString.current === searchString) return;
    lastSearchString.current = searchString;

    const newPagination = getInitialPagination();
    const newFilters = getInitialFilters();

    setPagination((prev) => {
      if (
        prev.pageIndex !== newPagination.pageIndex ||
        prev.pageSize !== newPagination.pageSize
      ) {
        return newPagination;
      }
      return prev;
    });

    setFilters((prev) => {
      const prevStr = JSON.stringify(prev);
      const newStr = JSON.stringify(newFilters);
      if (prevStr !== newStr) {
        return newFilters;
      }
      return prev;
    });
  }, [searchString, getInitialPagination, getInitialFilters]);

  // Handlers
  const handlePaginationChange = useCallback(
    (newPagination: typeof pagination) => {
      setPagination(newPagination);
      updateURL(newPagination, filters);
    },
    [filters, updateURL]
  );

  const handleFilterSubmit = useCallback(
    (submittedFilters: typeof filters) => {
      const newPagination = { ...pagination, pageIndex: 0 };
      setFilters(submittedFilters);
      setPagination(newPagination);
      updateURL(newPagination, submittedFilters);
    },
    [pagination, updateURL]
  );

  const handleFilterReset = useCallback(() => {
    const newPagination = { ...pagination, pageIndex: 0 };
    setFilters({});
    setPagination(newPagination);
    updateURL(newPagination, {});
  }, [pagination, updateURL]);

  return {
    pagination,
    filters,
    handlePaginationChange,
    handleFilterSubmit,
    handleFilterReset,
  };
}
