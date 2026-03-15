import type { Pengupasan } from "@/services/pengupasanService";
import type { Pembayaran } from "@/services/pembayaranService";
import { formatCurrency, formatDate, formatDecimal } from "@/lib/utils";
import { buildReceiptDocument } from "@/print/templates/receiptBase";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildPengupasanNotaDocument(input: {
  pengupasan: Pengupasan;
  pembayaran?: Pembayaran | null;
  outletName?: string;
  widthMm?: number;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { pengupasan, pembayaran } = input;
  const widthMm = input.widthMm ?? 80;

  const invoice = pengupasan.invoice ?? "";
  const pekerjaNama = pengupasan.pekerja?.nama ?? "-";
  const pekerjaTelp = pengupasan.pekerja?.telepon ?? "";

  const qtyKg = Number(pengupasan.produkJumlah || 0);
  const upahSatuan = Number(pengupasan.upah_satuan || 0);
  const totalUpah =
    pengupasan.total_upah !== null && pengupasan.total_upah !== undefined
      ? Number(pengupasan.total_upah)
      : qtyKg * upahSatuan;

  const kemiriCampur =
    pengupasan.kemiri_campur_jumlah !== null &&
    pengupasan.kemiri_campur_jumlah !== undefined
      ? `${formatDecimal(Number(pengupasan.kemiri_campur_jumlah))} kg`
      : null;
  const kemiriCangkang =
    pengupasan.kemiri_cangkang_jumlah !== null &&
    pengupasan.kemiri_cangkang_jumlah !== undefined
      ? `${formatDecimal(Number(pengupasan.kemiri_cangkang_jumlah))} kg`
      : null;

  const outletName = input.outletName ?? "BJM";

  const pembayaranTanggal =
    pembayaran?.createdAt ? formatDate(pembayaran.createdAt) : "-";
  const pembayaranMetode = pembayaran
    ? pembayaran.isCashless
      ? "Cashless"
      : "Tunai"
    : "-";

  const rekeningText =
    pembayaran?.rekening?.bank && pembayaran?.rekening?.nama
      ? `${pembayaran.rekening.bank} - ${pembayaran.rekening.nama}`
      : "-";

  const catatanPengupasan = pengupasan.catatan?.trim()
    ? pengupasan.catatan.trim()
    : "";
  const catatanPembayaran = pembayaran?.catatan?.trim()
    ? pembayaran.catatan.trim()
    : "";

  const safe = (s: string) => escapeHtml(s);

  const title = invoice ? `Nota Pengupasan - ${invoice}` : "Nota Pengupasan";

  const bodyHtml = `
    <div class="center">
      <div><strong>${safe(outletName)}</strong></div>
      <div>NOTA PENGUPASAN</div>
      <div class="tiny">${invoice ? `Invoice: ${safe(invoice)}` : `ID: ${safe(pengupasan.id)}`}</div>
    </div>
    <div class="hr"></div>

    <div class="line">Status   : ${safe(pengupasan.status)}</div>
    <div class="wrap">Pekerja  : ${safe(pekerjaNama)}${pekerjaTelp ? ` (${safe(pekerjaTelp)})` : ""}</div>
    <div class="line">Mulai    : ${pengupasan.tanggal_mulai ? safe(formatDate(pengupasan.tanggal_mulai)) : "-"}</div>
    <div class="line">Selesai  : ${pengupasan.tanggal_selesai ? safe(formatDate(pengupasan.tanggal_selesai)) : "-"}</div>

    <div class="hr"></div>

    <div class="line">Produk   : Kemiri Kering</div>
    <div class="line">Input    : ${safe(`${formatDecimal(qtyKg)} kg`)}</div>
    ${kemiriCampur ? `<div class="line">K.Campur : ${safe(kemiriCampur)}</div>` : ""}
    ${kemiriCangkang ? `<div class="line">K.Cangkang: ${safe(kemiriCangkang)}</div>` : ""}
    <div class="line">Upah/kg  : ${safe(formatCurrency(upahSatuan))}</div>
    <div class="hr"></div>
    <div class="line"><strong>Total Upah</strong></div>
    <div class="line right"><strong>${safe(formatCurrency(totalUpah))}</strong></div>
    <div class="tiny muted">${safe(`${formatDecimal(qtyKg)} kg x ${formatCurrency(upahSatuan)}`)}</div>

    ${
      catatanPengupasan
        ? `
          <div class="hr"></div>
          <div class="line"><strong>Catatan</strong></div>
          <div class="wrap">${safe(catatanPengupasan)}</div>
        `
        : ""
    }

    <div class="hr"></div>
    <div class="line"><strong>Pembayaran</strong></div>
    ${
      pembayaran
        ? `
          <div class="line">Invoice  : ${safe(pembayaran.invoice)}</div>
          <div class="line">Arus     : ${safe(pembayaran.arus)}</div>
          <div class="line">Metode   : ${safe(pembayaranMetode)}</div>
          <div class="wrap">Rekening : ${safe(rekeningText)}</div>
          <div class="line">Tanggal  : ${safe(pembayaranTanggal)}</div>
          <div class="hr"></div>
          <div class="line"><strong>Total Bayar</strong></div>
          <div class="line right"><strong>${safe(formatCurrency(pembayaran.total))}</strong></div>
        `
        : `<div class="line muted">Belum ada pembayaran</div>`
    }
    ${
      catatanPembayaran
        ? `<div class="tiny muted">Catatan: ${safe(catatanPembayaran)}</div>`
        : ""
    }

    <div class="hr"></div>
    <div class="center tiny muted">Terima kasih</div>
  `;

  return buildReceiptDocument({
    title,
    bodyHtml,
    widthMm,
    printedAt: input.printedAt ?? new Date(),
    autoPrint: input.autoPrint,
    showActions: true,
  });
}
