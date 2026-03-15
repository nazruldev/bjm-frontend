"use client";

import * as React from "react";
import { type ColumnDef, type RowSelectionState } from "@tanstack/react-table";
import { toast } from "sonner";

import { DataTable } from "@/components/datatables";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ReusableFormDialog,
  type FormConfig,
} from "@/components/datatables/customForm";

import {
  DataTableFilters,
  type FilterConfig,
} from "@/components/datatables/filters"
import { DeleteDialog } from "@/components/datatables/dialogDelete";

// Props untuk reusable page
export interface DataTablesProps<
  TData extends { id: number | string }
> {
  title: string;
  description?: string;
  data: TData[];
  columns: ColumnDef<TData>[];
  formConfig?: FormConfig<any>;
  onAdd?: (data: any) => void | Promise<void>;
  onDelete?: (id: number | string) => void | Promise<void>;
  onBatchDelete?: (ids: (number | string)[]) => void | Promise<void>;
  onUpdate?: (data: TData) => void | Promise<void>;
  enableRowSelection?: boolean;
  /** Jika ada, hanya row yang return true yang bisa diselect (untuk batch delete). Mencegah select row yang sudah masuk payroll dll. */
  getRowCanSelect?: (row: TData) => boolean;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  emptyMessage?: string;
  getRowId?: (row: TData) => string;
  getIdFromRow?: (row: TData) => number | string;
  getNameFromRow?: (row: TData) => string;
  filterConfigs?: FilterConfig[];
  customFilters?: React.ReactNode;
  filterValues?: Record<string, any>; // Add filter values prop
  onFilterSubmit?: (values: Record<string, any>) => void; // Add submit handler
  onFilterReset?: () => void; // Add reset handler
  formDialogOpen?: boolean;
  onFormDialogOpenChange?: (open: boolean) => void;
  onAddClick?: () => void;
  defaultFilterOpen?: boolean; // Add defaultFilterOpen prop
  customButtons?: React.ReactNode; // Custom buttons to add next to the add button
}

export function DataTables<TData extends { id: number | string }>({
  title,
  description,
  data: initialData,
  columns: initialColumns,
  formConfig,
  onAdd,

  onBatchDelete,
  enableRowSelection = true,
  getRowCanSelect,
  enableColumnVisibility = true,
  enablePagination = true,
  pageSize = 10,
  pageCount,
  pagination: controlledPagination,
  onPaginationChange,
  emptyMessage = "No data found.",
  getRowId,
  getIdFromRow = (row) => row.id,

  filterConfigs,
  customFilters,
  filterValues: externalFilterValues,
  onFilterSubmit,
  onFilterReset,
  formDialogOpen: controlledFormDialogOpen,
  onFormDialogOpenChange: onControlledFormDialogOpenChange,
  onAddClick: externalOnAddClick,
  defaultFilterOpen,
  customButtons,
}: DataTablesProps<TData>) {
  const [internalOpenDialog, setInternalOpenDialog] = React.useState(false);
  
  // Use controlled or uncontrolled dialog state
  const openDialog = controlledFormDialogOpen ?? internalOpenDialog;
  const setOpenDialog = onControlledFormDialogOpenChange ?? setInternalOpenDialog;

  const [batchDeleteOpen, setBatchDeleteOpen] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState<TData[]>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  // Use external filter values if provided, otherwise use internal state
  const [internalFilterValues, setInternalFilterValues] = React.useState<Record<string, any>>({});
  const filterValues = externalFilterValues ?? internalFilterValues;

  // REMOVED: useEffect untuk setData - langsung gunakan initialData
  // TanStack Query sudah mengelola data, tidak perlu state lokal

  // REMOVED: console.log useEffect

  const columns = initialColumns;

  const handleAddSuccess = async (formData: any) => {
    if (onAdd) {
      await onAdd(formData);
    }
  };

  // Get selected rows from rowSelection state
  const getSelectedRowsFromSelection = React.useCallback(() => {
    const selectedIds = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    // For server-side pagination, only return rows from current page
    return initialData.filter((item) =>
      selectedIds.includes(String(getIdFromRow(item)))
    );
  }, [rowSelection, initialData, getIdFromRow]);

  const handleBatchDelete = (rows: TData[]) => {
    setSelectedRows(rows);
    setBatchDeleteOpen(true);
  };

  const confirmBatchDelete = async () => {
    if (onBatchDelete) {
      const ids = selectedRows.map((row) => getIdFromRow(row));
      await onBatchDelete(ids);
      // REMOVED: setData modification - TanStack Query will refetch automatically
      // REMOVED: toast - should be handled in mutation hook
      setRowSelection({});
      setSelectedRows([]);
      setBatchDeleteOpen(false);
    }
  };

  // REMOVED: Client-side filtering untuk server-side pagination
  // Gunakan data langsung dari props karena filtering dilakukan di backend
  const filteredData = initialData;

  // Handler untuk row selection change - standard TanStack Table behavior
  const handleRowSelectionChange = React.useCallback(
    (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      setRowSelection((prev) => {
        const newSelection = typeof updater === 'function' 
          ? updater(prev) 
          : updater;
        return newSelection;
      });
    },
    []
  );

  // Reset rowSelection when data changes (pagination)
  React.useEffect(() => {
    setRowSelection({});
  }, [initialData]);

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

  // Update filterOpen when defaultFilterOpen or hasActiveFilters change
  React.useEffect(() => {
    const shouldBeOpen = defaultFilterOpen !== undefined 
      ? defaultFilterOpen 
      : hasActiveFilters;
    setFilterOpen(shouldBeOpen);
  }, [defaultFilterOpen, hasActiveFilters]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <Separator />
        <CardContent>
          <DataTable
            data={filteredData}
            columns={columns}
            enableRowSelection={
              getRowCanSelect
                ? (row: { original: TData }) => getRowCanSelect(row.original)
                : enableRowSelection
            }
            enableColumnVisibility={enableColumnVisibility}
            enablePagination={enablePagination}
            pageSize={pageSize}
            pageCount={pageCount}
            pagination={controlledPagination}
            onPaginationChange={onPaginationChange}
            rowSelection={rowSelection}
            onRowSelectionChange={handleRowSelectionChange}
            showAddButton={!!formConfig || !!externalOnAddClick}
            addButtonLabel={formConfig ? `Tambah ${title}` : `Tambah ${title}`}
            onAddClick={() => {
              if (externalOnAddClick) {
                externalOnAddClick();
              } else {
                setOpenDialog(true);
              }
            }}
            showBatchDelete={!!onBatchDelete}
            onBatchDelete={(rows) => {
              const selectedRowsFromState = getSelectedRowsFromSelection();
              handleBatchDelete(selectedRowsFromState.length > 0 ? selectedRowsFromState : rows);
            }}
            emptyMessage={emptyMessage}
            getRowId={getRowId || ((row) => String(getIdFromRow(row)))}
            customButtons={customButtons}
            filters={
              filterConfigs && filterConfigs.length > 0 ? (
                <DataTableFilters
                  filters={filterConfigs}
                  values={filterValues}
                  onChange={(key, value) => {
                    // Only update draft, not final values
                    if (!externalFilterValues) {
                      setInternalFilterValues((prev) => {
                        const newValues = { ...prev };
                        if (value === undefined || value === null || value === "") {
                          delete newValues[key];
                        } else {
                          newValues[key] = value;
                        }
                        return newValues;
                      });
                    }
                  }}
                  onReset={onFilterReset}
                  onSubmit={onFilterSubmit || ((values) => {
                    // Fallback untuk internal state
                    setInternalFilterValues(values);
                    if (onPaginationChange) {
                      onPaginationChange({
                        pageIndex: 0,
                        pageSize: controlledPagination?.pageSize || pageSize,
                      });
                    }
                  })}
                />
              ) : (
                customFilters || null
              )
            }
            filterValues={filterValues}
            defaultFilterOpen={
              // Check if there are active filters
              filterValues && Object.values(filterValues).some(
                (v) => v !== undefined && v !== null && v !== ""
              )
            }
          />
        </CardContent>
      </Card>

      {formConfig && (
        <ReusableFormDialog
          key={formConfig.defaultValues?.id || "new"} // Force re-render when editing different items
          open={openDialog}
          onOpenChange={setOpenDialog}
          config={formConfig}
          onSuccess={handleAddSuccess}
        />
      )}

      <DeleteDialog
        open={batchDeleteOpen}
        onOpenChange={setBatchDeleteOpen}
        onConfirm={confirmBatchDelete}
        isBatch={true}
        count={selectedRows.length}
        itemType={title.toLowerCase() || "item"}
      />
    </>
  );
}
