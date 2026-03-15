import { formatCurrency, formatDate } from "@/lib/utils";
import { buildA4Document } from "@/print/templates/a4Base";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export type InvoiceForNota = {
  id: string;
  invoice: string;
  total: number;
  dibayar: number;
  status: string;
  createdAt: string | Date;
  approvedBy?: { nama: string } | null;
  confirmedBy?: { nama: string } | null;
};

export type PembayaranForNota = {
  id: string;
  invoice: string;
  total: number;
  arus: "MASUK" | "KELUAR";
  createdAt: string | Date;
  rekening?: { bank: string; nama: string } | null;
  catatan?: string | null;
  isCashless?: boolean;
};

export function buildNotaHutangPiutangA4Document(input: {
  type: "hutang" | "piutang";
  invoice: InvoiceForNota;
  pembayarans: PembayaranForNota[];
  subjekName?: string;
  outletName?: string;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { type, invoice, pembayarans, outletName = "BJM Kotamobagu" } = input;
  const subjekName = input.subjekName ?? "-";

  const label = type === "hutang" ? "HUTANG" : "PIUTANG";
  const title = `Nota ${label} - ${invoice.invoice}`;

  const tanggal = invoice.createdAt ? formatDate(invoice.createdAt) : "-";
  const total = Number(invoice.total ?? 0);
  const dibayar = Number(invoice.dibayar ?? 0);
  const sisa = total - dibayar;
  const approvedBy = invoice.approvedBy?.nama ?? "";
  const confirmedBy = invoice.confirmedBy?.nama ?? "";

  const rowsHtml =
    pembayarans.length === 0
      ? `
    <tr>
      <td colspan="5" class="muted" style="text-align:center; padding:16px;">
        Belum ada pembayaran
      </td>
    </tr>
  `
      : pembayarans
          .map((p, i) => {
            const no = i + 1;
            const pTotal = formatCurrency(p.total);
            const pTanggal = p.createdAt ? formatDate(p.createdAt) : "-";
            const metode = p.rekening
              ? `${escapeHtml(p.rekening.bank)} - ${escapeHtml(p.rekening.nama)}`
              : "Tunai";
            const arus = p.arus === "MASUK" ? "Masuk" : "Keluar";
            const catatan = p.catatan?.trim() ? escapeHtml(p.catatan) : "-";
            return `
    <tr>
      <td>${no}</td>
      <td class="mono">${escapeHtml(p.invoice)}</td>
      <td>${escapeHtml(pTanggal)}</td>
      <td>${escapeHtml(metode)}</td>
      <td class="right">${escapeHtml(pTotal)}</td>
    </tr>
    ${p.catatan?.trim() ? `<tr><td colspan="5" class="muted" style="font-size:11px; padding-left:24px;">Catatan: ${catatan}</td></tr>` : ""}
  `;
          })
          .join("");

  const bodyHtml = `
    <div class="row">
      <div class="col">
        <div class="h1">${escapeHtml(outletName)}</div>
        <div class="muted" style="margin-top:4px;">Nota ${label} (A4)</div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="h1">NOTA ${label}</div>
        <div class="muted" style="margin-top:4px;">
          Invoice: <span class="mono">${escapeHtml(invoice.invoice)}</span>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="row">
      <div class="col box">
        <div class="h2">INFORMASI INVOICE</div>
        <div class="kv">
          <div class="k">Subjek</div><div class="v">${escapeHtml(subjekName)}</div>
          <div class="k">Invoice</div><div class="v mono">${escapeHtml(invoice.invoice)}</div>
          <div class="k">Tanggal Dibuat</div><div class="v">${escapeHtml(tanggal)}</div>
          <div class="k">Status</div><div class="v">${escapeHtml(invoice.status)}</div>
          ${approvedBy ? `<div class="k">Disetujui Oleh</div><div class="v">${escapeHtml(approvedBy)}</div>` : ""}
          ${confirmedBy ? `<div class="k">Dikonfirmasi Oleh</div><div class="v">${escapeHtml(confirmedBy)}</div>` : ""}
        </div>
      </div>
      <div class="col box">
        <div class="h2">RINGKASAN</div>
        <div class="kv">
          <div class="k">Total</div><div class="v"><strong>${escapeHtml(formatCurrency(total))}</strong></div>
          <div class="k">Dibayar</div><div class="v" style="color:#15803d;">${escapeHtml(formatCurrency(dibayar))}</div>
          <div class="k">Sisa</div><div class="v" style="color:#b91c1c; font-weight:700;">${escapeHtml(formatCurrency(sisa))}</div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="h2" style="margin-bottom:8px;">DAFTAR PEMBAYARAN</div>
    <table>
      <thead>
        <tr>
          <th>No</th>
          <th>Invoice Pembayaran</th>
          <th>Tanggal</th>
          <th>Metode</th>
          <th class="right">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="footer" style="margin-top:24px;">
      <div class="sign">
        <div class="muted" style="font-size:12px;">Dicetak</div>
      </div>
      <div class="sign">
        <div class="muted" style="font-size:12px;">Mengetahui</div>
      </div>
    </div>
  `;

  return buildA4Document({
    title,
    bodyHtml,
    printedAt: input.printedAt ?? new Date(),
    autoPrint: input.autoPrint,
    showActions: true,
  });
}
