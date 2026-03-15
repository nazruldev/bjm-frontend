import type { Pembelian } from "@/services/pembelianService";
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

export function buildPembelianA4Document(input: {
  pembelian: Pembelian;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { pembelian } = input;
  const printedAt = input.printedAt ?? new Date();

  const invoice = pembelian.invoice ?? "";
  const title = invoice ? `Pembelian - ${invoice}` : `Pembelian - ${pembelian.id}`;

  const pemasokNama = pembelian.pemasok?.nama ?? "Walk-in";
  const pemasokTelp = pembelian.pemasok?.telepon ?? "";
  const pemasokAlamat = pembelian.pemasok?.alamat ?? "";
  const createdBy = pembelian.createdBy?.nama ?? "-";
  const createdByEmail = pembelian.createdBy?.email ?? "";
  const tanggal = pembelian.createdAt
    ? formatDate(pembelian.createdAt)
    : "-";
  const total = Number(pembelian.total ?? 0);

  const detailRows = pembelian.detail?.length
    ? pembelian.detail
        .map(
          (d) => `
          <tr>
            <td>${escapeHtml(d.produk?.nama_produk ?? "-")}</td>
            <td class="right">${escapeHtml(d.produk?.satuan ?? "-")}</td>
            <td class="right">${Number(d.jumlah).toLocaleString("id-ID")}</td>
            <td class="right">${escapeHtml(formatCurrency(Number(d.harga ?? 0)))}</td>
            <td class="right">${escapeHtml(formatCurrency(Number(d.subtotal)))}</td>
          </tr>`
        )
        .join("")
    : "";

  const bodyHtml = `
    <div class="row">
      <div class="col">
        <div class="h1">NOTA PEMBELIAN</div>
        <div class="muted" style="margin-top:4px;">Dokumen A4</div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="h1">${escapeHtml(invoice || pembelian.id)}</div>
        <div class="muted" style="margin-top:4px;">
          Tanggal: <span class="mono">${escapeHtml(tanggal)}</span>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="row">
      <div class="col box">
        <div class="h2">PEMASOK</div>
        <div class="kv">
          <div class="k">Nama</div><div class="v">${escapeHtml(pemasokNama)}</div>
          ${pemasokTelp ? `<div class="k">Telepon</div><div class="v">${escapeHtml(pemasokTelp)}</div>` : ""}
          ${pemasokAlamat ? `<div class="k">Alamat</div><div class="v">${escapeHtml(pemasokAlamat)}</div>` : ""}
        </div>
      </div>
      <div class="col box">
        <div class="h2">DIBUAT OLEH</div>
        <div class="kv">
          <div class="k">Nama</div><div class="v">${escapeHtml(createdBy)}</div>
          ${createdByEmail ? `<div class="k">Email</div><div class="v">${escapeHtml(createdByEmail)}</div>` : ""}
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="box">
      <div class="h2">DETAIL PEMBELIAN</div>
      <table>
        <thead>
          <tr>
            <th>Produk</th>
            <th class="right">Satuan</th>
            <th class="right">Jumlah</th>
            <th class="right">Harga</th>
            <th class="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${detailRows || '<tr><td colspan="5" class="muted">Tidak ada detail</td></tr>'}
        </tbody>
      </table>

      <div class="total">
        <div class="totalBox">
          <div class="totalLine"><span>Total Pembelian</span><span class="mono">${escapeHtml(formatCurrency(total))}</span></div>
        </div>
      </div>
    </div>

    ${
      pembelian.catatan?.trim()
        ? `
    <div class="divider"></div>
    <div class="box">
      <div class="h2">CATATAN</div>
      <div style="white-space:pre-wrap; word-break:break-word; font-size:13px;">
        ${escapeHtml(pembelian.catatan.trim())}
      </div>
    </div>
    `
        : ""
    }

    <div class="footer">
      <div class="sign">
        <div class="muted" style="font-size:12px;">Pemasok</div>
      </div>
      <div class="sign">
        <div class="muted" style="font-size:12px;">Diterima</div>
      </div>
    </div>
  `;

  return buildA4Document({
    title,
    bodyHtml,
    printedAt,
    autoPrint: input.autoPrint,
    showActions: true,
  });
}
