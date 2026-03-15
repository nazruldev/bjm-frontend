import type { Penjemuran } from "@/services/penjemuranService";
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

export function buildPenjemuranNotaDocument(input: {
  penjemuran: Penjemuran;
  pembayaran?: Pembayaran | null;
  outletName?: string;
  widthMm?: number;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { penjemuran, pembayaran } = input;
  const widthMm = input.widthMm ?? 80;

  const invoice = penjemuran.invoice ?? "";
  const pekerjaNama = penjemuran.pekerja?.nama ?? "-";
  const pekerjaTelp = penjemuran.pekerja?.telepon ?? "";

  const qtyKg = Number(penjemuran.produkJumlah || 0);
  const upahSatuan = Number(penjemuran.upah_satuan || 0);
  const totalUpah =
    penjemuran.total_upah !== null && penjemuran.total_upah !== undefined
      ? Number(penjemuran.total_upah)
      : qtyKg * upahSatuan;

  const printedAt = input.printedAt ?? new Date();

  const susutJumlah =
    penjemuran.susut_jumlah !== null && penjemuran.susut_jumlah !== undefined
      ? `${formatDecimal(Number(penjemuran.susut_jumlah))} kg`
      : null;
  const susutPersen =
    penjemuran.susut_percentage !== null &&
    penjemuran.susut_percentage !== undefined
      ? `${formatDecimal(Number(penjemuran.susut_percentage))}%`
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

  const catatanPenjemuran = penjemuran.catatan?.trim()
    ? penjemuran.catatan.trim()
    : "";
  const catatanPembayaran = pembayaran?.catatan?.trim()
    ? pembayaran.catatan.trim()
    : "";

  const safe = (s: string) => escapeHtml(s);

  const title = invoice ? `Nota Penjemuran - ${invoice}` : "Nota Penjemuran";

  const bodyHtml = `
    <div class="center">
      <div><strong>${safe(outletName)}</strong></div>
      <div>NOTA PENJEMURAN</div>
      <div class="tiny">${invoice ? `Invoice: ${safe(invoice)}` : `ID: ${safe(penjemuran.id)}`}</div>
    </div>
    <div class="hr"></div>

    <div class="line">Status   : ${safe(penjemuran.status)}</div>
    <div class="wrap">Pekerja  : ${safe(pekerjaNama)}${pekerjaTelp ? ` (${safe(pekerjaTelp)})` : ""}</div>
    <div class="line">Mulai    : ${penjemuran.tanggal_mulai ? safe(formatDate(penjemuran.tanggal_mulai)) : "-"}</div>
    <div class="line">Selesai  : ${penjemuran.tanggal_selesai ? safe(formatDate(penjemuran.tanggal_selesai)) : "-"}</div>

    <div class="hr"></div>

    <div class="line">Produk   : Kemiri Gaba</div>
    <div class="line">Input    : ${safe(`${formatDecimal(qtyKg)} kg`)}</div>
    ${
      susutJumlah || susutPersen
        ? `<div class="line">Susut   : ${safe([susutJumlah, susutPersen].filter(Boolean).join(" / "))}</div>`
        : ""
    }
    <div class="line">Upah/kg  : ${safe(formatCurrency(upahSatuan))}</div>
    <div class="hr"></div>
    <div class="line"><strong>Total Upah</strong></div>
    <div class="line right"><strong>${safe(formatCurrency(totalUpah))}</strong></div>
    <div class="tiny muted">${safe(`${formatDecimal(qtyKg)} kg x ${formatCurrency(upahSatuan)}`)}</div>

    ${
      catatanPenjemuran
        ? `
          <div class="hr"></div>
          <div class="line"><strong>Catatan</strong></div>
          <div class="wrap">${safe(catatanPenjemuran)}</div>
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
    printedAt,
    autoPrint: input.autoPrint,
    showActions: true,
  });
}

