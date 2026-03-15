"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FilterIcon,
  Plus,
  Trash2,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
  showBatchDelete?: boolean;
  onBatchDelete?: (selectedRows: TData[]) => void;
  customButtons?: React.ReactNode; // Custom buttons to add next to the add button

  emptyMessage?: string;
  getRowId?: (row: TData) => string;
  filters?: React.ReactNode; // Custom filters component
  filterValues?: Record<string, any>; // Add filter values to check if filters are active
  defaultFilterOpen?: boolean; // Add prop to control initial filter state
}

export function DataTable<TData>({
  data,
  columns,
  enableRowSelection = true,
  enableColumnVisibility = false,
  enablePagination = true,
  pageSize = 10,
  pageSizeOptions = [2,10, 20, 30, 40, 50],
  pageCount,
  pagination: controlledPagination,
  onPaginationChange,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  showAddButton = false,
  addButtonLabel = "Add",
  onAddClick,
  showBatchDelete = false,
  onBatchDelete,
  customButtons,
  emptyMessage = "No results.",
  getRowId,
  filters,
  filterValues,
  defaultFilterOpen = false,
}: DataTableProps<TData>) {
  // Use controlled row selection if provided, otherwise use internal state
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
  const rowSelection = controlledRowSelection ?? internalRowSelection;
  
  // Wrapper to handle row selection change - standard TanStack Table behavior
  const handleRowSelectionChange = React.useCallback(
    (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      if (onRowSelectionChange) {
        // Use functional update to avoid stale closure
        const newSelection =
          typeof updater === "function" 
            ? updater(rowSelection) 
            : updater;
        onRowSelectionChange(newSelection);
      } else {
        setInternalRowSelection((prev) => {
          const newSelection =
            typeof updater === "function" ? updater(prev) : updater;
          return newSelection;
        });
      }
    },
    [onRowSelectionChange, rowSelection]
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  // Check if there are active filters from filterValues prop
  const hasActiveFilters = React.useMemo(() => {
    if (!filterValues) return false;
    return Object.values(filterValues).some(
      (v) => v !== undefined && v !== null && v !== ""
    );
  }, [filterValues]);

  // Initialize filterOpen - use defaultFilterOpen if provided, otherwise check hasActiveFilters
  const [filterOpen, setFilterOpen] = React.useState(() => {
    return defaultFilterOpen !== undefined ? defaultFilterOpen : hasActiveFilters;
  });

  // Sync filterOpen with defaultFilterOpen and hasActiveFilters
  React.useEffect(() => {
    const shouldBeOpen = defaultFilterOpen !== undefined 
      ? defaultFilterOpen 
      : hasActiveFilters;
    setFilterOpen(shouldBeOpen);
  }, [defaultFilterOpen, hasActiveFilters]);

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  
  // Use controlled pagination if provided, otherwise use internal state
  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  });
  const pagination = controlledPagination ?? internalPagination;
  
  // Wrapper to handle both value and updater function
  const handlePaginationChange = React.useCallback(
    (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
      if (onPaginationChange) {
        const newPagination =
          typeof updater === "function" ? updater(pagination) : updater;
        onPaginationChange(newPagination);
      } else {
        setInternalPagination(
          typeof updater === "function" ? updater(internalPagination) : updater
        );
      }
    },
    [onPaginationChange, pagination, internalPagination]
  );
  
  // Determine if we're using server-side pagination
  const manualPagination = pageCount !== undefined;

  const onFilterToogle = () => {
    setFilterOpen(!filterOpen);
  };
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    getRowId,
    enableRowSelection,
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Use manual pagination for server-side, otherwise use client-side
    manualPagination: manualPagination,
    pageCount: pageCount,
    getPaginationRowModel: enablePagination && !manualPagination
      ? getPaginationRowModel()
      : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: "includesString",
  });

  const tableContent = (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const paginationControls = enablePagination && (
    <div className="flex items-center justify-between px-4">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              const newPageSize = Number(value);
              if (onPaginationChange) {
                // Reset to first page when page size changes
                onPaginationChange({
                  pageIndex: 0,
                  pageSize: newPageSize,
                });
              } else {
                // For uncontrolled pagination, set page size and reset to first page
                table.setPageSize(newPageSize);
                table.setPageIndex(0);
              }
            }}
          >
            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {pageCount ?? table.getPageCount()}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {/* First Page Button */}
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => {
              if (onPaginationChange) {
                onPaginationChange({
                  pageIndex: 0,
                  pageSize: pagination.pageSize,
                });
              } else {
                table.setPageIndex(0);
              }
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="size-4" />
          </Button>
          
          {/* Previous Page Button */}
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => {
              if (onPaginationChange) {
                onPaginationChange({
                  pageIndex: pagination.pageIndex - 1,
                  pageSize: pagination.pageSize,
                });
              } else {
                table.previousPage();
              }
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="size-4" />
          </Button>
          
          {/* Next Page Button */}
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => {
              if (onPaginationChange) {
                onPaginationChange({
                  pageIndex: pagination.pageIndex + 1,
                  pageSize: pagination.pageSize,
                });
              } else {
                table.nextPage();
              }
            }}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="size-4" />
          </Button>
          
          {/* Last Page Button */}
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => {
              const lastPageIndex = (pageCount ?? table.getPageCount()) - 1;
              if (onPaginationChange) {
                onPaginationChange({
                  pageIndex: lastPageIndex,
                  pageSize: pagination.pageSize,
                });
              } else {
                table.setPageIndex(lastPageIndex);
              }
            }}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const toolbar = (
    <div className="flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-1">
        {showBatchDelete &&
          onBatchDelete &&
          table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                const selectedRows = table
                  .getFilteredSelectedRowModel()
                  .rows.map((row) => row.original);
                onBatchDelete(selectedRows);
              }}
            >
              <Trash2 className="size-4" />
              <span className="hidden lg:inline">
                Delete ({table.getFilteredSelectedRowModel().rows.length})
              </span>
              <span className="lg:hidden">
                ({table.getFilteredSelectedRowModel().rows.length})
              </span>
            </Button>
          )}
        {showAddButton && (
          <Button variant="outline" size="sm" onClick={onAddClick}>
            <Plus className="size-4" />
            <span className="hidden lg:inline">{addButtonLabel}</span>
          </Button>
        )}
        {customButtons}

        {filters && (
          <Button
            variant={filterOpen ? "default" : "outline"}
            size="sm"
            onClick={onFilterToogle}
          >
            <FilterIcon className="size-4" />
            <span className="hidden lg:inline">Filter</span>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-1">
      <div>{toolbar}</div>
      {filters && filterOpen && (
        <div className="border border-dashed bg-gray-50  mx-4 lg:mx-6 my-1 p-2 rounded ">
          {filters}
        </div>
      )}
      <div className="relative flex flex-col gap-1 overflow-auto px-4 lg:px-6">
        {tableContent}
        {paginationControls}
      </div>
    </div>
  );
}
