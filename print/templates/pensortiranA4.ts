import type { Pensortiran } from "@/services/pensortiranService";
import { formatDate, formatDecimal } from "@/lib/utils";
import { buildA4Document } from "@/print/templates/a4Base";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildPensortiranA4Document(input: {
  pensortiran: Pensortiran;
  outletName?: string;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { pensortiran } = input;
  const printedAt = input.printedAt ?? new Date();
  const outletName = input.outletName ?? "BJM";

  const invoice = pensortiran.invoice ?? "";
  const title = invoice ? `Pensortiran - ${invoice}` : `Pensortiran - ${pensortiran.id}`;

  const inspectorNama = pensortiran.inspector?.nama ?? "-";
  const inspectorEmail = pensortiran.inspector?.email
    ? ` (${pensortiran.inspector.email})`
    : "";

  const inputKg = Number(pensortiran.produkJumlah || 0);
  const menir = Number(pensortiran.jumlah_menir || 0);
  const abu = Number(pensortiran.jumlah_abu || 0);
  const keping = Number(pensortiran.jumlah_keping || 0);
  const bulat = Number(pensortiran.jumlah_bulat || 0);
  const busuk = Number(pensortiran.jumlah_busuk || 0);
  const totalHasil = menir + abu + keping + bulat + busuk;

  const bodyHtml = `
    <div class="row">
      <div class="col">
        <div class="h1">${escapeHtml(outletName)}</div>
        <div class="muted" style="margin-top:4px;">Dokumen: <strong>Nota Pensortiran (A4)</strong></div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="h1">PENSORTIRAN</div>
        <div class="muted" style="margin-top:4px;">
          ${invoice ? `Invoice: <span class="mono">${escapeHtml(invoice)}</span>` : `ID: <span class="mono">${escapeHtml(pensortiran.id)}</span>`}
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="row">
      <div class="col box">
        <div class="h2">INFORMASI</div>
        <div class="kv">
          <div class="k">Status</div><div class="v">${escapeHtml(pensortiran.status)}</div>
          <div class="k">Inspector</div><div class="v">${escapeHtml(inspectorNama + inspectorEmail)}</div>
          <div class="k">Tanggal Mulai</div><div class="v">${pensortiran.tanggal_mulai ? escapeHtml(formatDate(pensortiran.tanggal_mulai)) : "-"}</div>
          <div class="k">Tanggal Selesai</div><div class="v">${pensortiran.tanggal_selesai ? escapeHtml(formatDate(pensortiran.tanggal_selesai)) : "-"}</div>
        </div>
      </div>
      <div class="col box">
        <div class="h2">INPUT</div>
        <div class="kv">
          <div class="k">Produk</div><div class="v">Kemiri Campur</div>
          <div class="k">Jumlah Input</div><div class="v">${escapeHtml(formatDecimal(inputKg))} kg</div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="box">
      <div class="h2">HASIL SORTIR</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="right">Jumlah (kg)</th>
          </tr>
        </thead>
        <tbody>
          ${menir > 0 ? `<tr><td>Menir</td><td class="right">${escapeHtml(formatDecimal(menir))}</td></tr>` : ""}
          ${abu > 0 ? `<tr><td>Abu</td><td class="right">${escapeHtml(formatDecimal(abu))}</td></tr>` : ""}
          ${keping > 0 ? `<tr><td>Keping</td><td class="right">${escapeHtml(formatDecimal(keping))}</td></tr>` : ""}
          ${bulat > 0 ? `<tr><td>Bulat</td><td class="right">${escapeHtml(formatDecimal(bulat))}</td></tr>` : ""}
          ${busuk > 0 ? `<tr><td>Busuk (tidak masuk stok)</td><td class="right">${escapeHtml(formatDecimal(busuk))}</td></tr>` : ""}
        </tbody>
      </table>

      <div class="total">
        <div class="totalBox">
          <div class="totalLine"><span>Total Hasil</span><span class="mono">${escapeHtml(formatDecimal(totalHasil))} kg</span></div>
        </div>
      </div>
    </div>

    ${
      pensortiran.catatan?.trim()
        ? `
    <div class="divider"></div>
    <div class="box">
      <div class="h2">CATATAN</div>
      <div style="white-space:pre-wrap; word-break:break-word; font-size:13px;">
        ${escapeHtml(pensortiran.catatan.trim())}
      </div>
    </div>
    `
        : ""
    }

    <div class="footer">
      <div class="sign">
        <div class="muted" style="font-size:12px;">Inspector</div>
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
