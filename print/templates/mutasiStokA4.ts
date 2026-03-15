import type { MutasiStok, MutasiStokByProdukResponse } from "@/services/mutasiStokService";
import { formatDate } from "@/lib/utils";
import { buildA4Document } from "@/print/templates/a4Base";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSumberLabel(m: MutasiStok & { pengupasanId?: string | null; pensortiranId?: string | null; penjualanId?: string | null }): string {
  if (m.penjemuranId) return "Penjemuran";
  if (m.pembelianId) return "Pembelian";
  if (m.pengupasanId) return "Pengupasan";
  if (m.pensortiranId) return "Pensortiran";
  if (m.penjualanId) return "Penjualan";
  return "Manual";
}

const TIPE_LABELS: Record<string, string> = {
  MASUK: "Masuk",
  KELUAR: "Keluar",
  SUSUT: "Susut",
  HILANG: "Hilang",
  RUSAK: "Rusak",
};

export function buildMutasiStokA4Document(input: {
  produkNama: string;
  produkSatuan?: string;
  data: MutasiStok[];
  saldo?: MutasiStokByProdukResponse["saldo"];
  dateFrom?: string | null;
  dateTo?: string | null;
  tipe?: string | null;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { produkNama, data, saldo, dateFrom, dateTo, tipe } = input;
  const printedAt = input.printedAt ?? new Date();
  const satuan = input.produkSatuan || "kg";
  const title = `Laporan Riwayat Mutasi Stok - ${escapeHtml(produkNama)}`;

  const hasDateFilter = dateFrom || dateTo;
  const dateRangeText = hasDateFilter
    ? `${dateFrom ? formatDate(dateFrom) : "..."} s/d ${dateTo ? formatDate(dateTo) : "..."}`
    : "";
  const tipeLabel = tipe && tipe !== "__all__" ? (TIPE_LABELS[tipe] ?? tipe) : "";

  const filterLines: string[] = [];
  if (dateRangeText) filterLines.push(`Periode: ${dateRangeText}`);
  if (tipeLabel) filterLines.push(`Tipe Mutasi: ${escapeHtml(tipeLabel)}`);
  const filterInfoHtml =
    filterLines.length > 0
      ? `
    <div class="box" style="margin-bottom:12px;">
      <div class="h2">FILTER YANG DIGUNAKAN</div>
      <div style="font-size:13px;">
        ${filterLines.map((line) => `<div class="muted">${line}</div>`).join("")}
      </div>
    </div>
  `
      : "";

  const rows =
    data.length > 0
      ? data
          .map(
            (d) => {
              const m = d as MutasiStok & { pengupasanId?: string | null; pensortiranId?: string | null; penjualanId?: string | null };
              const tanggal = formatDate(d.tanggal);
              const jumlah = Number(d.jumlah).toLocaleString("id-ID");
              const tipe = d.tipe;
              const keterangan = (d.keterangan || "-").toString().slice(0, 60);
              const sumber = getSumberLabel(m);
              return `
          <tr>
            <td>${escapeHtml(tanggal)}</td>
            <td class="right">${escapeHtml(jumlah)} ${escapeHtml(satuan)}</td>
            <td>${escapeHtml(tipe)}</td>
            <td>${escapeHtml(sumber)}</td>
            <td>${escapeHtml(keterangan)}</td>
          </tr>`;
            }
          )
          .join("")
      : '<tr><td colspan="5" class="muted">Tidak ada data mutasi stok</td></tr>';

  const saldoHtml =
    saldo
      ? `
    <div class="total" style="margin-top:16px;">
      <div class="totalBox" style="min-width:320px;">
        <div class="h2" style="margin-bottom:8px;">RINGKASAN SALDO</div>
        <div class="kv">
          <div class="k">Masuk</div><div class="v">${Number(saldo.masuk).toLocaleString("id-ID")} ${escapeHtml(satuan)}</div>
          <div class="k">Keluar</div><div class="v">${Number(saldo.keluar).toLocaleString("id-ID")} ${escapeHtml(satuan)}</div>
          <div class="k">Susut</div><div class="v">${Number(saldo.susut).toLocaleString("id-ID")} ${escapeHtml(satuan)}</div>
          <div class="k">Hilang</div><div class="v">${Number(saldo.hilang).toLocaleString("id-ID")} ${escapeHtml(satuan)}</div>
          <div class="k">Rusak</div><div class="v">${Number(saldo.rusak).toLocaleString("id-ID")} ${escapeHtml(satuan)}</div>
        </div>
        <div class="divider" style="margin:10px 0;"></div>
        <div class="totalLine">
          <span>Saldo Akhir</span>
          <span class="mono">${Number(saldo.saldoAkhir).toLocaleString("id-ID")} ${escapeHtml(satuan)}</span>
        </div>
      </div>
    </div>`
      : "";

  const bodyHtml = `
    <div class="row">
      <div class="col">
        <div class="h1">LAPORAN RIWAYAT MUTASI STOK</div>
        <div class="muted" style="margin-top:4px;">${escapeHtml(produkNama)}</div>
      </div>
    </div>

    <div class="divider"></div>

    ${filterInfoHtml}

    <div class="box">
      <div class="h2">DETAIL MUTASI</div>
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th class="right">Jumlah</th>
            <th>Tipe</th>
            <th>Sumber</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      ${saldoHtml}
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
