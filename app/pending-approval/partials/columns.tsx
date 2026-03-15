import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, FileText, Send } from "lucide-react";
import type { PendingApprovalItem } from "@/services/pendingApprovalService";
import { formatDateTime } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  HUTANG_BAYAR: "Pembayaran Hutang",
  PIUTANG_BAYAR: "Penerimaan Piutang",
  PEMBELIAN_BAYAR: "Pembayaran Pembelian",
  KEUANGAN_CREATE: "Transaksi Keuangan",
  PENGAJIAN_BAYAR: "Pembayaran Gaji",
  PIUTANG_KONFIRMASI_BAYAR: "Konfirmasi Kasbon Cashless",
  PENJEMURAN_BAYAR: "Pembayaran Penjemuran (Cashless)",
  PENGUPASAN_BAYAR: "Pembayaran Pengupasan (Cashless)",
};

function getSumberLabel(item: PendingApprovalItem): string {
  if (item.sumberLabel?.trim()) return item.sumberLabel;
  return TYPE_LABELS[item.type] || item.type;
}

function getDisplaySummary(item: PendingApprovalItem): string {
  if (item.displaySummary?.trim()) return item.displaySummary;
  const s = (item.payload?.summary as string)?.trim();
  if (s) return s;
  return `${TYPE_LABELS[item.type] || item.type} - pembayaran cashless menunggu approval owner.`;
}

export function createPendingApprovalColumns(
  opts: {
    onDetail: (item: PendingApprovalItem) => void;
    onCopyLink: (id: string) => void;
    onResend: (id: string) => void;
    getApprovalUrl: (id: string) => string;
    isOwner: boolean;
  }
): ColumnDef<PendingApprovalItem>[] {
  const { onDetail, onCopyLink, onResend, getApprovalUrl, isOwner } = opts;
  return [
    {
      accessorKey: "type",
      header: "Sumber",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{getSumberLabel(row.original)}</span>
      ),
    },
    {
      accessorKey: "displaySummary",
      header: "Ringkasan",
      cell: ({ row }) => (
        <span
          className="block truncate max-w-[220px] text-muted-foreground"
          title={getDisplaySummary(row.original)}
        >
          {getDisplaySummary(row.original)}
        </span>
      ),
    },
    {
      accessorKey: "outlet",
      header: "Outlet",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.outlet?.nama ?? "-"}</span>
      ),
    },
    {
      accessorKey: "createdBy",
      header: "Diajukan",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.createdBy?.nama ?? "-"}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Tanggal",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const item = row.original;
        const url = getApprovalUrl(item.id);
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => onDetail(item)}
            >
              <FileText className="size-3.5 mr-1" />
              Detail
            </Button>
            {isOwner && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => onCopyLink(item.id)}
                >
                  <Copy className="size-3.5 mr-1" />
                  Copy
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5 mr-1" />
                    Buka
                  </a>
                </Button>
              </>
            )}
            {!isOwner && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => onResend(item.id)}
              >
                <Send className="size-3.5 mr-1" />
                Resend
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
