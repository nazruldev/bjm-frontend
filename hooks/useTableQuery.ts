"use client";

import { useMemo } from "react";

interface UseTableQueryOptions<TParams> {
  pagination: { pageIndex: number; pageSize: number };
  filters: Record<string, any>;
  buildParams?: (
    pagination: { pageIndex: number; pageSize: number },
    filters: Record<string, any>
  ) => TParams;
}

export function useTableQuery<TParams extends Record<string, any>>(
  options: UseTableQueryOptions<TParams>
) {
  const { pagination, filters, buildParams } = options;

  const queryParams = useMemo(() => {
    if (buildParams) {
      return buildParams(pagination, filters);
    }

    // Default: build params dengan page, limit, dan filters
    return {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        ...Object.entries(filters).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>),
    } as unknown as TParams;
  }, [pagination.pageIndex, pagination.pageSize, filters, buildParams]);

  return queryParams;
}
