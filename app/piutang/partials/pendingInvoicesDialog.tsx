"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePendingInvoices, useConfirmPiutang, useResendPiutangNotification, useDeletePiutang, usePiutangCountByStatus } from "@/hooks/usePiutangs";
import { useTableState } from "@/hooks/useTableState";
import { FileText, User, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw, Search, X, Send, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import * as React from "react";
import { useQueryUtils } from "@/lib/query-utils";
import { pendingInvoiceKeys } from "@/hooks/usePiutangs";
import { useAuth } from "@/hooks/useAuth";
import { useRekenings } from "@/hooks/useRekenings";
import { useForm } from "@tanstack/react-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/delete-dialog";
import { useConfirmPassword } from "@/components/dialog-confirm-password";

interface PendingInvoice {
  id: string;
  invoice: string;
  total: number;
  dibayar: number;
  status: "PENDING" | "APPROVED";
  /** True jika sudah di-approve admin dan pilih cashless, tapi belum di-approve owner (masih di PendingApproval) */
  menungguApprovalCashless?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  subjekId: string;
  subjekType: "KARYAWAN" | "PEKERJA" | "PEMASOK";
  outletId?: string;
  outlet?: {
    id: string;
    nama: string;
  } | null;
  subjek?: {
    id: string;
    nama: string;
    telepon?: string | null;
  } | null;
  user?: {
    id: string;
    nama: string;
    telepon?: string | null;
  } | null;
}

interface PendingInvoicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Total count PENDING (dari API count by status) */
  totalPendingCount?: number;
  /** Total count APPROVED (dari API count by status) */
  totalApprovedCount?: number;
}

export function PendingInvoicesDialog({
  open,
  onOpenChange,
  totalPendingCount,
  totalApprovedCount,
}: PendingInvoicesDialogProps) {
  const { pagination, handlePaginationChange } = useTableState({
    defaultPageSize: 10,
  });

  const [invoiceFilter, setInvoiceFilter] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"PENDING" | "APPROVED" | "APPROVED_MENUNGGU_CASHLESS">("PENDING");
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<PendingInvoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = React.useState<PendingInvoice | null>(null);
  
  const { user } = useAuth();
  const { openConfirmPassword } = useConfirmPassword();
  const canDeletePiutang = user?.role === "OWNER";
  const confirmPiutang = useConfirmPiutang();
  const resendNotification = useResendPiutangNotification();
  const deletePiutang = useDeletePiutang();
  const { refetchMultipleQueries } = useQueryUtils();
  const { data: rekeningsData } = useRekenings({
    limit: 1000,
    isActive: true,
  });

  const rekeningOptions = React.useMemo(() => {
    if (!rekeningsData?.data) return [];
    return rekeningsData.data.map((rekening) => ({
      value: rekening.id,
      label: `${rekening.bank} - ${rekening.nama}`,
    }));
  }, [rekeningsData]);

  // Reset pagination when tab changes
  React.useEffect(() => {
    handlePaginationChange({
      pageIndex: 0,
      pageSize: pagination.pageSize,
    });
  }, [activeTab]);

  const handleConfirmClick = (invoice: PendingInvoice) => {
    setSelectedInvoice(invoice);
    setConfirmDialogOpen(true);
  };

  const handleConfirm = async (formData: {
    isCashless: boolean;
    rekeningId: string | null;
  }) => {
    if (!selectedInvoice) return;
    
    const outletId = selectedInvoice.outletId || selectedInvoice.outlet?.id || (user as any)?.outletId;
    if (!outletId) {
      toast.error("Outlet ID tidak ditemukan");
      return;
    }
    
    try {
      await confirmPiutang.mutateAsync({
        id: selectedInvoice.id,
        outletId: outletId,
        isCashless: formData.isCashless || false,
        rekeningId: formData.isCashless ? formData.rekeningId : null,
      });
      // Refetch data setelah confirm
      await refetchMultipleQueries([
        pendingInvoiceKeys.all,
        ["piutang", "count"],
      ]);
      setConfirmDialogOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      // Error sudah di-handle di hook
    }
  };

  const handleResendNotification = (invoice: PendingInvoice) => {
    resendNotification.mutate(invoice.id, {
      onSuccess: async () => {
        // Refetch data setelah resend
        await refetchMultipleQueries([pendingInvoiceKeys.all]);
      },
    });
  };

  const handleDeleteClick = (invoice: PendingInvoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!invoiceToDelete) return;
    deletePiutang.mutate(invoiceToDelete.id, {
      onSuccess: async () => {
        setDeleteDialogOpen(false);
        setInvoiceToDelete(null);
        // Refetch data setelah delete
        await refetchMultipleQueries([
          pendingInvoiceKeys.all,
          ["piutang", "count"],
        ]);
      },
    });
  };

  const {
    data: pendingData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = usePendingInvoices({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const { data: countData, refetch: refetchCount } = usePiutangCountByStatus({
    status: "PENDING,APPROVED",
  });

  React.useEffect(() => {
    if (open) refetchCount();
  }, [open, refetchCount]);

  const allInvoices = (pendingData?.data ||
    []) as unknown as PendingInvoice[];

  // Filter invoices by status and invoice number
  const filteredInvoices = React.useMemo(() => {
    let filtered = allInvoices;

    // Filter by status / tab
    if (activeTab === "PENDING") {
      filtered = filtered.filter((invoice) => invoice.status === "PENDING");
    } else if (activeTab === "APPROVED") {
      filtered = filtered.filter(
        (invoice) => invoice.status === "APPROVED" && !invoice.menungguApprovalCashless
      );
    } else {
      // APPROVED_MENUNGGU_CASHLESS
      filtered = filtered.filter(
        (invoice) => invoice.status === "APPROVED" && invoice.menungguApprovalCashless === true
      );
    }

    // Filter by invoice number
    if (invoiceFilter.trim()) {
      const filterLower = invoiceFilter.toLowerCase().trim();
      filtered = filtered.filter((invoice) =>
        invoice.invoice?.toLowerCase().includes(filterLower)
      );
    }

    return filtered;
  }, [allInvoices, invoiceFilter, activeTab]);

  const pendingInvoices = filteredInvoices;
  const totalPages = pendingData?.pagination?.totalPages || 1;
  const currentPage = pagination.pageIndex + 1;

  const counts = countData?.data as Record<string, number> | undefined;
  const summary = (countData as { summary?: Array<{ status: string; count: number }> })?.summary;
  const fromListPending = allInvoices.filter((i) => i.status === "PENDING").length;
  const fromListApproved = allInvoices.filter(
    (i) => i.status === "APPROVED" && !i.menungguApprovalCashless
  ).length;
  const fromListMenungguCashless = allInvoices.filter(
    (i) => i.status === "APPROVED" && i.menungguApprovalCashless === true
  ).length;
  const apiPending = typeof counts?.PENDING === "number" ? counts.PENDING : summary?.find((s) => s.status === "PENDING")?.count ?? undefined;
  const apiApproved = typeof counts?.APPROVED === "number" ? counts.APPROVED : summary?.find((s) => s.status === "APPROVED")?.count ?? undefined;
  const apiMenungguCashless = typeof counts?.APPROVED_MENUNGGU_CASHLESS === "number" ? counts.APPROVED_MENUNGGU_CASHLESS : undefined;
  const countPending = apiPending !== undefined && apiPending > 0 ? apiPending : Math.max(totalPendingCount ?? 0, fromListPending);
  const countApproved = apiApproved !== undefined && apiApproved > 0 ? apiApproved : Math.max(totalApprovedCount ?? 0, fromListApproved);
  const countMenungguCashless = apiMenungguCashless ?? fromListMenungguCashless;

  const handleRefetch = () => {
    refetch();
    refetchCount();
  };

  const handleClearFilter = () => {
    setInvoiceFilter("");
  };

  const handlePreviousPage = () => {
    if (pagination.pageIndex > 0) {
      handlePaginationChange({
        pageIndex: pagination.pageIndex - 1,
        pageSize: pagination.pageSize,
      });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePaginationChange({
        pageIndex: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Daftar Piutang Pending & Approved</DialogTitle>
          <DialogDescription>
            Daftar invoice piutang yang berstatus pending dan approved
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="flex items-center gap-2  px-5 ">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "PENDING" | "APPROVED" | "APPROVED_MENUNGGU_CASHLESS")}>
            <TabsList>
              <TabsTrigger value="PENDING" className="gap-1.5">
                Pending
                <Badge variant={countPending > 0 ? "destructive" : "secondary"} className="size-5 min-w-5 justify-center p-0 text-xs">
                  {countPending}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="APPROVED" className="gap-1.5">
                Approved
                <Badge variant={Math.max(0, countApproved - countMenungguCashless) > 0 ? "destructive" : "secondary"} className="size-5 min-w-5 justify-center p-0 text-xs">
                  {Math.max(0, countApproved - countMenungguCashless)}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="APPROVED_MENUNGGU_CASHLESS" className="gap-1.5">
                Menunggu Approval Cashless
                <Badge variant={countMenungguCashless > 0 ? "destructive" : "secondary"} className="size-5 min-w-5 justify-center p-0 text-xs">
                  {countMenungguCashless}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari invoice..."
              value={invoiceFilter}
              onChange={(e) => setInvoiceFilter(e.target.value)}
              className="pl-9 pr-9"
            />
            {invoiceFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 size-10"
                onClick={handleClearFilter}
              >
                <X className="size-5" />
                <span className="sr-only">Clear filter</span>
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleRefetch}
            disabled={isRefetching || isLoading}
          >
            <RefreshCw
              className={`size-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline ml-2">Refresh</span>
          </Button>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto  space-y-2 px-5 py-2">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <div className="text-destructive p-4 text-sm">
              Error: {error.message || "Gagal memuat data pending invoices"}
            </div>
          ) : pendingInvoices.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              {activeTab === "PENDING"
                ? "Tidak ada invoice pending ditemukan"
                : activeTab === "APPROVED"
                  ? "Tidak ada invoice approved (non-cashless) ditemukan"
                  : "Tidak ada invoice menunggu approval cashless ditemukan"}
            </div>
          ) : (
            pendingInvoices.map((invoice, index) => {
              const invoiceNumber = invoice.invoice || "-";
              const namaSubjek = invoice.subjek?.nama || "-";
              const totalPinjaman = formatCurrency(invoice.total);
              const tanggalPinjam = formatDate(invoice.createdAt);
              const status = invoice.status as any;
              // Ensure unique key - use id if available, otherwise use index with invoice number
              const uniqueKey =
                invoice.id || `pending-invoice-${index}-${invoiceNumber}`;

              return (
                <Card
                  key={uniqueKey}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <CardContent className="p-0">
                    <div>
                      {/* Header: Invoice & Status */}
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="size-4 text-muted-foreground shrink-0" />
                          <span className="font-mono font-medium text-sm truncate">
                            {invoiceNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {status === "PENDING" && (
                            <>
                              <Button
                                onClick={() => handleResendNotification(invoice)}
                                disabled={resendNotification.isPending}
                                size="sm"
                                variant="default"
                              >
                                <Send className="size-3 mr-1" />
                                Resend
                              </Button>
                              {canDeletePiutang && (
                                <Button
                                  onClick={() => handleDeleteClick(invoice)}
                                  disabled={deletePiutang.isPending}
                                  size="sm"
                                  variant="destructive"
                                >
                                  <Trash2 className="size-3 mr-1" />
                                  Hapus
                                </Button>
                              )}
                            </>
                          )}
                          {status === "APPROVED" && !invoice.menungguApprovalCashless && (
                            <Button
                              onClick={() => handleConfirmClick(invoice)}
                              disabled={confirmPiutang.isPending || !(invoice.outletId || invoice.outlet?.id || (user as any)?.outletId)}
                              size="sm"
                            >
                              Konfirmasi
                            </Button>
                          )}
                          {status === "APPROVED" && invoice.menungguApprovalCashless && (
                            <Badge variant="secondary">
                              Menunggu Approval Cashless
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {namaSubjek}
                          </span>
                          |
                        </div>

                        {/* Total Pinjaman */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {totalPinjaman}
                          </span>
                          |
                        </div>

                        {/* Tanggal */}
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {tanggalPinjam}
                          </span>
                         
                        </div>
                       
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !error && pendingInvoices.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <span className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Confirm Dialog */}
      <ConfirmPiutangDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        invoice={selectedInvoice}
        onConfirm={handleConfirm}
        onOpenConfirmPassword={openConfirmPassword}
        rekeningOptions={rekeningOptions}
        isLoading={confirmPiutang.isPending}
      />

      {/* Delete Confirmation Dialog */}
      {invoiceToDelete && (
        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          itemName={invoiceToDelete.invoice}
          itemType="piutang"
        />
      )}
    </Dialog>
  );
}

// Confirm Dialog Component
interface ConfirmPiutangDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: PendingInvoice | null;
  onConfirm: (data: { isCashless: boolean; rekeningId: string | null }) => Promise<void>;
  onOpenConfirmPassword: (opts: { title?: string; description?: string; onConfirm: () => void | Promise<void> }) => void;
  rekeningOptions: { value: string; label: string }[];
  isLoading: boolean;
}

function ConfirmPiutangDialog({
  open,
  onOpenChange,
  invoice,
  onConfirm,
  onOpenConfirmPassword,
  rekeningOptions,
  isLoading,
}: ConfirmPiutangDialogProps) {
  const form = useForm({
    defaultValues: {
      isCashless: false,
      rekeningId: null as string | null,
    },
    validators: {
      onSubmit: ({ value }) => {
        if (value.isCashless && !value.rekeningId) {
          return "Rekening wajib diisi jika menggunakan cashless";
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      const payload = {
        isCashless: value.isCashless,
        rekeningId: value.isCashless ? value.rekeningId : null,
      };
      onOpenConfirmPassword({
        title: "Konfirmasi password",
        description: "Masukkan password Anda untuk konfirmasi piutang.",
        onConfirm: async () => {
          await onConfirm(payload);
        },
      });
    },
  });

  React.useEffect(() => {
    if (open && invoice) {
      form.reset();
    }
  }, [open, invoice]);

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Konfirmasi Piutang</DialogTitle>
          <DialogDescription>
            Pilih metode pembayaran untuk konfirmasi piutang ini. Konsepnya uang keluar.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Invoice Info */}
          <div className="p-3 bg-muted rounded-md space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Invoice:</span>
              <span className="font-mono font-medium">{invoice.invoice}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold">{formatCurrency(invoice.total)}</span>
            </div>
          </div>

          {/* Is Cashless */}
          <form.Field name="isCashless">
            {(field) => (
              <Field>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value || false}
                    onCheckedChange={(checked) => {
                      field.handleChange(checked as boolean);
                      // Reset rekeningId ke null dan clear error jika isCashless false
                      if (!checked) {
                        form.setFieldValue("rekeningId", null);
                        // Clear error untuk rekeningId
                        form.setFieldMeta("rekeningId", (prev) => ({
                          ...prev,
                          errors: [],
                          errorMap: {},
                        }));
                      }
                    }}
                    onBlur={field.handleBlur}
                  />
                  <FieldLabel htmlFor={field.name} className="cursor-pointer">
                    Cashless (Pembayaran Non Tunai)
                  </FieldLabel>
                </div>
                {field.state.meta.errors && (
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          {/* Rekening Sumber */}
          <form.Subscribe
            selector={(state) => [state.values.isCashless]}
            children={([isCashless]) => {
              return (
                <form.Field
                  name="rekeningId"
                  validators={{
                    onChange: ({ value }: { value: string | null }) => {
                      if (isCashless && !value) {
                        return "Rekening wajib diisi jika menggunakan cashless";
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel>Rekening Sumber {isCashless ? "*" : ""}</FieldLabel>
                      <Select
                        disabled={!isCashless}
                        value={field.state.value || ""}
                        onValueChange={(value) => {
                          field.handleChange(value);
                          field.handleBlur();
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih rekening" />
                        </SelectTrigger>
                        <SelectContent>
                          {rekeningOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                        <FieldError>{field.state.meta.errors[0]}</FieldError>
                      )}
                    </Field>
                  )}
                </form.Field>
              );
            }}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Mengkonfirmasi..." : "Konfirmasi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
