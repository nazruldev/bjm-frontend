import type { Keuangan } from "@/services/keuanganService";
import { formatCurrency, formatDate } from "@/lib/utils";
import { buildReceiptDocument } from "@/print/templates/receiptBase";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildKeuanganNotaDocument(input: {
  keuangan: Keuangan;
  outletName?: string;
  widthMm?: number;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { keuangan } = input;
  const widthMm = input.widthMm ?? 80;
  const outletName = input.outletName ?? "BJM";
  const invoice = keuangan.invoice ?? "";
  const arus = keuangan.arus ?? "KELUAR";
  const tipeLabel = arus === "MASUK" ? "UANG MASUK" : "PENGELUARAN";
  const tanggal = keuangan.createdAt ? formatDate(keuangan.createdAt) : "-";
  const total = Number(keuangan.total ?? 0);
  const createdBy = keuangan.createdBy?.nama ?? "-";
  const catatan = keuangan.catatan?.trim() ?? "";
  const safe = (s: string) => escapeHtml(s);

  const bodyHtml = [
    `<div class="center"><div><strong>${safe(outletName)}</strong></div><div>NOTA KEUANGAN - ${tipeLabel}</div>`,
    `<div class="tiny">${invoice ? `Invoice: ${safe(invoice)}` : `ID: ${safe(keuangan.id)}`}</div></div>`,
    `<div class="hr"></div><div class="line">Tanggal: ${safe(tanggal)}</div><div class="line">Dibuat oleh: ${safe(createdBy)}</div>`,
    `<div class="hr"></div><div class="line"><strong>Jumlah</strong></div><div class="line right"><strong>${arus === "MASUK" ? "+" : ""}${safe(formatCurrency(total))}</strong></div>`,
    catatan ? `<div class="hr"></div><div class="line"><strong>Catatan</strong></div><div class="wrap">${safe(catatan)}</div>` : "",
    `<div class="hr"></div><div class="center tiny muted">Terima kasih</div>`,
  ].join("");

  return buildReceiptDocument({
    title: invoice ? `Nota Keuangan - ${invoice}` : "Nota Keuangan",
    bodyHtml,
    widthMm,
    printedAt: input.printedAt ?? new Date(),
    autoPrint: input.autoPrint,
    showActions: true,
  });
}
