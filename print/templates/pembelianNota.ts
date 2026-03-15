import type { Pembelian } from "@/services/pembelianService";
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

export function buildPembelianNotaDocument(input: {
  pembelian: Pembelian;
  widthMm?: number;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { pembelian } = input;
  const printedAt = input.printedAt ?? new Date();
  const widthMm = input.widthMm ?? 80;

  const invoice = pembelian.invoice ?? "";
  const title = invoice ? `Nota Pembelian - ${invoice}` : "Nota Pembelian";

  const pemasokNama = pembelian.pemasok?.nama ?? "Walk-in";
  const pemasokTelp = pembelian.pemasok?.telepon ?? "";
  const pemasokAlamat = pembelian.pemasok?.alamat ?? "";
  const createdBy = pembelian.createdBy?.nama ?? "-";
  const tanggal = pembelian.createdAt
    ? formatDate(pembelian.createdAt)
    : "-";
  const total = Number(pembelian.total ?? 0);

  const safe = (s: string) => escapeHtml(s);

  let detailRows = "";
  if (pembelian.detail?.length) {
    detailRows = pembelian.detail
      .map(
        (d) => `
    <div class="line">${safe(d.produk?.nama_produk ?? "-")}</div>
    <div class="line">  ${Number(d.jumlah).toLocaleString("id-ID")} ${safe(d.produk?.satuan ?? "")} x ${safe(formatCurrency(Number(d.harga ?? 0)))}</div>
    <div class="line">  ${safe(formatCurrency(Number(d.subtotal)))}</div>
    <div class="hr"></div>`
      )
      .join("");
  } else {
    detailRows = '<div class="line muted">Tidak ada detail</div>';
  }

  const bodyHtml = `
    <div >
      <div><strong>STRUK PEMBELIAN</strong></div>
      <div class="tiny">${invoice ? `${safe(invoice)}` : `${safe(pembelian.id)}`}</div>
      
    </div>
    <div class="hr"></div>

    <div class="line tiny">Tanggal  : ${safe(tanggal)}</div>
    <div class="wrap tiny">Pemasok  : ${safe(pemasokNama)}${pemasokTelp ? ` (${safe(pemasokTelp)})` : ""}</div>
    ${pemasokAlamat ? `<div class="wrap">Alamat   : ${safe(pemasokAlamat)}</div>` : ""}
    <div class="line tiny">Dibuat   : ${safe(createdBy)}</div>

    <div class="hr"></div>
    <div class="line"><strong>Detail Barang</strong></div>
    ${detailRows}
  
    <div class="line"><strong>Total Pembelian</strong></div>
    <div class="line "><strong>${safe(formatCurrency(total))}</strong></div>

    ${
      pembelian.catatan?.trim()
        ? `
    <div class="hr"></div>
    <div class="line"><strong>Catatan</strong></div>
    <div class="wrap">${safe(pembelian.catatan.trim())}</div>
    `
        : ""
    }

    <div class="hr"></div>
    <div class="center">Terima kasih</div>
  `;

  return buildReceiptDocument({
    title,
    bodyHtml,
    widthMm,
    printedAt,
    autoPrint: input.autoPrint,
    showActions: true,
  });
}
