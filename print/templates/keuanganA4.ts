import type { Keuangan } from "@/services/keuanganService";
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

export function buildKeuanganA4Document(input: {
  keuangan: Keuangan;
  outletName?: string;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { keuangan } = input;
  const outletName = input.outletName ?? "BJM";

  const invoice = keuangan.invoice ?? "";
  const arus = keuangan.arus ?? "KELUAR";
  const tipeLabel = arus === "MASUK" ? "UANG MASUK LACI" : "PENGELUARAN";
  const title = invoice ? `Keuangan - ${invoice}` : `Keuangan - ${keuangan.id}`;
  const tanggal = keuangan.createdAt ? formatDate(keuangan.createdAt) : "-";
  const total = Number(keuangan.total ?? 0);
  const createdBy = keuangan.createdBy?.nama ?? "-";
  const createdByEmail = keuangan.createdBy?.email ?? "";

  const bodyHtml = `
    <div class="row">
      <div class="col">
        <div class="h1">${escapeHtml(outletName)}</div>
        <div class="muted" style="margin-top:4px;">Dokumen: <strong>Nota Keuangan (A4)</strong> - ${tipeLabel}</div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="h1">KEUANGAN</div>
        <div class="muted" style="margin-top:4px;">
          ${invoice ? `Invoice: <span class="mono">${escapeHtml(invoice)}</span>` : `ID: <span class="mono">${escapeHtml(keuangan.id)}</span>`}
        </div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="row">
      <div class="col box">
        <div class="h2">INFORMASI</div>
        <div class="kv">
          <div class="k">Tanggal</div><div class="v">${escapeHtml(tanggal)}</div>
          <div class="k">Dibuat Oleh</div><div class="v">${escapeHtml(createdBy)}</div>
          ${createdByEmail ? `<div class="k">Email</div><div class="v">${escapeHtml(createdByEmail)}</div>` : ""}
        </div>
      </div>
      <div class="col box">
        <div class="h2">JUMLAH</div>
        <div class="totalLine" style="font-size:18px; font-weight:800;">
          <span>${arus === "MASUK" ? "Uang Masuk" : "Keluar"}</span>
          <span class="mono">${arus === "MASUK" ? "+" : ""}${escapeHtml(formatCurrency(total))}</span>
        </div>
      </div>
    </div>
    ${keuangan.catatan?.trim() ? `
    <div class="divider"></div>
    <div class="box">
      <div class="h2">CATATAN</div>
      <div style="white-space:pre-wrap; word-break:break-word; font-size:13px;">
        ${escapeHtml(keuangan.catatan.trim())}
      </div>
    </div>
    ` : ""}
    <div class="footer">
      <div class="sign"><div class="muted" style="font-size:12px;">Dibuat Oleh</div></div>
      <div class="sign"><div class="muted" style="font-size:12px;">Admin</div></div>
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
