import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Skeleton untuk invoice table row
 */
export function InvoiceTableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-8" />
      </TableCell>
    </TableRow>
  );
}

/**
 * Skeleton untuk invoice table header
 */
export function InvoiceTableHeaderSkeleton() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>
          <Skeleton className="h-4 w-16" />
        </TableHead>
        <TableHead>
          <Skeleton className="h-4 w-12" />
        </TableHead>
        <TableHead>
          <Skeleton className="h-4 w-16" />
        </TableHead>
        <TableHead>
          <Skeleton className="h-4 w-12" />
        </TableHead>
        <TableHead>
          <Skeleton className="h-4 w-16" />
        </TableHead>
        <TableHead>
          <Skeleton className="h-4 w-12" />
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

/**
 * Skeleton untuk full invoice table
 */
export function InvoiceTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <InvoiceTableHeaderSkeleton />
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <InvoiceTableRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Skeleton untuk filter bar
 */
export function InvoiceFilterBarSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>
  );
}

/**
 * Skeleton untuk toolbar
 */
export function InvoiceToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-24" />
    </div>
  );
}

