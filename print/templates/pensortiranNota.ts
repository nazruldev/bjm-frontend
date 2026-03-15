import type { Pensortiran } from "@/services/pensortiranService";
import { formatDate, formatDecimal } from "@/lib/utils";
import { buildReceiptDocument } from "@/print/templates/receiptBase";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildPensortiranNotaDocument(input: {
  pensortiran: Pensortiran;
  outletName?: string;
  widthMm?: number;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { pensortiran } = input;
  const widthMm = input.widthMm ?? 80;

  const invoice = pensortiran.invoice ?? "";
  const inspectorNama = pensortiran.inspector?.nama ?? "-";
  const inspectorEmail = pensortiran.inspector?.email ?? "";

  const inputKg = Number(pensortiran.produkJumlah || 0);
  const menir = Number(pensortiran.jumlah_menir || 0);
  const abu = Number(pensortiran.jumlah_abu || 0);
  const keping = Number(pensortiran.jumlah_keping || 0);
  const bulat = Number(pensortiran.jumlah_bulat || 0);
  const busuk = Number(pensortiran.jumlah_busuk || 0);
  const totalHasil = menir + abu + keping + bulat + busuk;

  const printedAt = input.printedAt ?? new Date();
  const outletName = input.outletName ?? "BJM";
  const catatan = pensortiran.catatan?.trim() ? pensortiran.catatan.trim() : "";
  const safe = (s: string) => escapeHtml(s);

  const title = invoice ? `Nota Pensortiran - ${invoice}` : "Nota Pensortiran";

  const bodyHtml = `
    <div class="center">
      <div><strong>${safe(outletName)}</strong></div>
      <div>NOTA PENSORTIRAN</div>
      <div class="tiny">${invoice ? `Invoice: ${safe(invoice)}` : `ID: ${safe(pensortiran.id)}`}</div>
    </div>
    <div class="hr"></div>

    <div class="line">Status    : ${safe(pensortiran.status)}</div>
    <div class="wrap">Inspector : ${safe(inspectorNama)}${inspectorEmail ? ` (${safe(inspectorEmail)})` : ""}</div>
    <div class="line">Mulai     : ${pensortiran.tanggal_mulai ? safe(formatDate(pensortiran.tanggal_mulai)) : "-"}</div>
    <div class="line">Selesai   : ${pensortiran.tanggal_selesai ? safe(formatDate(pensortiran.tanggal_selesai)) : "-"}</div>

    <div class="hr"></div>

    <div class="line">Input (Kemiri Campur) : ${safe(formatDecimal(inputKg))} kg</div>
    <div class="hr"></div>
    <div class="line"><strong>Hasil Sortir</strong></div>
    ${menir > 0 ? `<div class="line">Menir   : ${safe(formatDecimal(menir))} kg</div>` : ""}
    ${abu > 0 ? `<div class="line">Abu     : ${safe(formatDecimal(abu))} kg</div>` : ""}
    ${keping > 0 ? `<div class="line">Keping  : ${safe(formatDecimal(keping))} kg</div>` : ""}
    ${bulat > 0 ? `<div class="line">Bulat   : ${safe(formatDecimal(bulat))} kg</div>` : ""}
    ${busuk > 0 ? `<div class="line">Busuk   : ${safe(formatDecimal(busuk))} kg</div>` : ""}
    <div class="hr"></div>
    <div class="line"><strong>Total Hasil</strong></div>
    <div class="line right"><strong>${safe(formatDecimal(totalHasil))} kg</strong></div>

    ${
      catatan
        ? `
    <div class="hr"></div>
    <div class="line"><strong>Catatan</strong></div>
    <div class="wrap">${safe(catatan)}</div>
    `
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
