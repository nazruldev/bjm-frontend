import type { Pengupasan } from "@/services/pengupasanService";
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

export function buildPengupasanA4Document(input: {
  pengupasan: Pengupasan;
  pembayaran?: Pembayaran | null;
  outletName?: string;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { pengupasan, pembayaran } = input;
  const printedAt = input.printedAt ?? new Date();
  const outletName = input.outletName ?? "BJM";

  const invoice = pengupasan.invoice ?? "";
  const title = invoice ? `Pengupasan - ${invoice}` : `Pengupasan - ${pengupasan.id}`;

  const qtyKg = Number(pengupasan.produkJumlah || 0);
  const upahSatuan = Number(pengupasan.upah_satuan || 0);
  const totalUpah =
    pengupasan.total_upah !== null && pengupasan.total_upah !== undefined
      ? Number(pengupasan.total_upah)
      : qtyKg * upahSatuan;

  const kemiriCampur =
    pengupasan.kemiri_campur_jumlah !== null &&
    pengupasan.kemiri_campur_jumlah !== undefined
      ? formatDecimal(Number(pengupasan.kemiri_campur_jumlah))
      : "-";
  const kemiriCangkang =
    pengupasan.kemiri_cangkang_jumlah !== null &&
    pengupasan.kemiri_cangkang_jumlah !== undefined
      ? formatDecimal(Number(pengupasan.kemiri_cangkang_jumlah))
      : "-";

  const pekerjaNama = pengupasan.pekerja?.nama ?? "-";
  const pekerjaTelp = pengupasan.pekerja?.telepon
    ? ` (${pengupasan.pekerja.telepon})`
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
        <div class="muted" style="margin-top:4px;">Dokumen: <strong>Nota Pengupasan (A4)</strong></div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="h1">PENGUPASAN</div>
        <div class="muted" style="margin-top:4px;">
          ${invoice ? `Invoice: <span class="mono">${escapeHtml(invoice)}</span>` : `ID: <span class="mono">${escapeHtml(pengupasan.id)}</span>`}
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="row">
      <div class="col box">
        <div class="h2">INFORMASI</div>
        <div class="kv">
          <div class="k">Status</div><div class="v">${escapeHtml(pengupasan.status)}</div>
          <div class="k">Pekerja</div><div class="v">${escapeHtml(pekerjaNama + pekerjaTelp)}</div>
          <div class="k">Tanggal Mulai</div><div class="v">${pengupasan.tanggal_mulai ? escapeHtml(formatDate(pengupasan.tanggal_mulai)) : "-"}</div>
          <div class="k">Tanggal Selesai</div><div class="v">${pengupasan.tanggal_selesai ? escapeHtml(formatDate(pengupasan.tanggal_selesai)) : "-"}</div>
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
            <td>Produk Input</td>
            <td class="right">Kemiri Kering</td>
          </tr>
          <tr>
            <td>Jumlah Input</td>
            <td class="right">${escapeHtml(`${formatDecimal(qtyKg)} kg`)}</td>
          </tr>
          <tr>
            <td>Kemiri Campur (output)</td>
            <td class="right">${escapeHtml(kemiriCampur)} kg</td>
          </tr>
          <tr>
            <td>Kemiri Cangkang (output)</td>
            <td class="right">${escapeHtml(kemiriCangkang)} kg</td>
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
      pengupasan.catatan?.trim()
        ? `
          <div class="divider"></div>
          <div class="box">
            <div class="h2">CATATAN</div>
            <div style="white-space:pre-wrap; word-break:break-word; font-size:13px;">
              ${escapeHtml(pengupasan.catatan.trim())}
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
