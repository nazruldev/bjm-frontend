"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton untuk table row
 */
export function OutletTableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="size-4" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 w-48" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 w-28" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="size-10 rounded" />
      </TableCell>
      <TableCell>
        <Skeleton className="size-8" />
      </TableCell>
    </TableRow>
  );
}

/**
 * Skeleton untuk table header
 */
export function OutletTableHeaderSkeleton() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">
          <Skeleton className="size-4" />
        </TableHead>
        <TableHead>
          <Skeleton className="h-4 w-24" />
        </TableHead>
        <TableHead>
          <Skeleton className="h-4 w-20" />
        </TableHead>
        <TableHead>
          <Skeleton className="h-4 w-28" />
        </TableHead>
        <TableHead>
          <Skeleton className="h-4 w-16" />
        </TableHead>
        <TableHead className="w-12">
          <Skeleton className="h-4 w-16" />
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

/**
 * Skeleton untuk full table dengan pagination
 */
export function OutletTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <OutletTableHeaderSkeleton />
            <TableBody>
              {Array.from({ length: rows }).map((_, i) => (
                <OutletTableRowSkeleton key={i} />
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton untuk filter bar
 */
export function OutletFilterSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6 py-4 border-b bg-muted/50">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-9 w-40" />
    </div>
  );
}

/**
 * Skeleton untuk toolbar (add button, column visibility, dll)
 */
export function OutletToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 lg:px-6 py-4">
      <Skeleton className="h-9 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

/**
 * Complete skeleton untuk outlet page
 */
export function OutletPageSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <div className="border-b">
        <OutletToolbarSkeleton />
        <OutletFilterSkeleton />
      </div>
      <CardContent className="pt-6">
        <div className="rounded-lg border">
          <Table>
            <OutletTableHeaderSkeleton />
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <OutletTableRowSkeleton key={i} />
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

