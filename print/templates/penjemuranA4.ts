import type { Penjemuran } from "@/services/penjemuranService";
import type { Pembayaran } from "@/services/pembayaranService";
import { formatCurrency, formatDate, formatDecimal } from "@/lib/utils";
import { buildA4Document } from "@/print/templates/a4Base";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildPenjemuranA4Document(input: {
  penjemuran: Penjemuran;
  pembayaran?: Pembayaran | null;
  outletName?: string;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { penjemuran, pembayaran } = input;
  const printedAt = input.printedAt ?? new Date();
  const outletName = input.outletName ?? "BJM";

  const invoice = penjemuran.invoice ?? "";
  const title = invoice ? `Penjemuran - ${invoice}` : `Penjemuran - ${penjemuran.id}`;

  const qtyKg = Number(penjemuran.produkJumlah || 0);
  const upahSatuan = Number(penjemuran.upah_satuan || 0);
  const totalUpah =
    penjemuran.total_upah !== null && penjemuran.total_upah !== undefined
      ? Number(penjemuran.total_upah)
      : qtyKg * upahSatuan;

  const susutJumlah =
    penjemuran.susut_jumlah !== null && penjemuran.susut_jumlah !== undefined
      ? `${formatDecimal(Number(penjemuran.susut_jumlah))} kg`
      : "-";
  const susutPersen =
    penjemuran.susut_percentage !== null &&
    penjemuran.susut_percentage !== undefined
      ? `${formatDecimal(Number(penjemuran.susut_percentage))}%`
      : "-";

  const pekerjaNama = penjemuran.pekerja?.nama ?? "-";
  const pekerjaTelp = penjemuran.pekerja?.telepon
    ? ` (${penjemuran.pekerja.telepon})`
    : "";

  const pembayaranMetode = pembayaran
    ? pembayaran.isCashless
      ? "Cashless"
      : "Tunai"
    : "-";
  const rekeningText =
    pembayaran?.rekening?.bank && pembayaran?.rekening?.nama
      ? `${pembayaran.rekening.bank} - ${pembayaran.rekening.nama}`
      : "-";

  const bodyHtml = `
    <div class="row">
      <div class="col">
        <div class="h1">${escapeHtml(outletName)}</div>
        <div class="muted" style="margin-top:4px;">Dokumen: <strong>Nota Penjemuran (A4)</strong></div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="h1">PENJEMURAN</div>
        <div class="muted" style="margin-top:4px;">
          ${invoice ? `Invoice: <span class="mono">${escapeHtml(invoice)}</span>` : `ID: <span class="mono">${escapeHtml(penjemuran.id)}</span>`}
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="row">
      <div class="col box">
        <div class="h2">INFORMASI</div>
        <div class="kv">
          <div class="k">Status</div><div class="v">${escapeHtml(penjemuran.status)}</div>
          <div class="k">Pekerja</div><div class="v">${escapeHtml(pekerjaNama + pekerjaTelp)}</div>
          <div class="k">Tanggal Mulai</div><div class="v">${penjemuran.tanggal_mulai ? escapeHtml(formatDate(penjemuran.tanggal_mulai)) : "-"}</div>
          <div class="k">Tanggal Selesai</div><div class="v">${penjemuran.tanggal_selesai ? escapeHtml(formatDate(penjemuran.tanggal_selesai)) : "-"}</div>
        </div>
      </div>
      <div class="col box">
        <div class="h2">PEMBAYARAN</div>
        ${
          pembayaran
            ? `
              <div class="kv">
                <div class="k">Invoice</div><div class="v mono">${escapeHtml(pembayaran.invoice)}</div>
                <div class="k">Arus</div><div class="v">${escapeHtml(pembayaran.arus)}</div>
                <div class="k">Metode</div><div class="v">${escapeHtml(pembayaranMetode)}</div>
                <div class="k">Rekening</div><div class="v">${escapeHtml(rekeningText)}</div>
                <div class="k">Tanggal</div><div class="v">${pembayaran.createdAt ? escapeHtml(formatDate(pembayaran.createdAt)) : "-"}</div>
              </div>
            `
            : `<div class="muted">Belum ada pembayaran</div>`
        }
      </div>
    </div>

    <div class="divider"></div>

    <div class="box">
      <div class="h2">RINCIAN</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="right">Nilai</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Produk</td>
            <td class="right">Kemiri Gaba</td>
          </tr>
          <tr>
            <td>Jumlah Input</td>
            <td class="right">${escapeHtml(`${formatDecimal(qtyKg)} kg`)}</td>
          </tr>
          <tr>
            <td>Susut (Jumlah / %)</td>
            <td class="right">${escapeHtml(`${susutJumlah} / ${susutPersen}`)}</td>
          </tr>
          <tr>
            <td>Upah / kg</td>
            <td class="right">${escapeHtml(formatCurrency(upahSatuan))}</td>
          </tr>
        </tbody>
      </table>

      <div class="total">
        <div class="totalBox">
          <div class="totalLine"><span>Total Upah</span><span class="mono">${escapeHtml(formatCurrency(totalUpah))}</span></div>
          <div class="muted" style="font-size:12px; margin-top:4px;">
            ${escapeHtml(`${formatDecimal(qtyKg)} kg x ${formatCurrency(upahSatuan)}`)}
          </div>
        </div>
      </div>
    </div>

    ${
      penjemuran.catatan?.trim()
        ? `
          <div class="divider"></div>
          <div class="box">
            <div class="h2">CATATAN</div>
            <div style="white-space:pre-wrap; word-break:break-word; font-size:13px;">
              ${escapeHtml(penjemuran.catatan.trim())}
            </div>
          </div>
        `
        : ""
    }

    ${
      pembayaran?.catatan?.trim()
        ? `
          <div class="divider"></div>
          <div class="box">
            <div class="h2">CATATAN PEMBAYARAN</div>
            <div style="white-space:pre-wrap; word-break:break-word; font-size:13px;">
              ${escapeHtml(pembayaran.catatan.trim())}
            </div>
          </div>
        `
        : ""
    }

    <div class="footer">
      <div class="sign">
        <div class="muted" style="font-size:12px;">Pekerja</div>
      </div>
      <div class="sign">
        <div class="muted" style="font-size:12px;">Admin</div>
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

