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

const STATUS_PENGIRIMAN_LABELS: Record<string, string> = {
  MENUNGGU: "Menunggu",
  DALAM_PENGIRIMAN: "Dalam Pengiriman",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export type OutletForInvoice = {
  id: string;
  nama: string;
  alamat?: string | null;
  telepon?: string | null;
  logo?: string | null;
};

export type DetailItemForInvoice = {
  id: string;
  jumlah: number;
  harga: number;
  subtotal: number;
  produk?: { id: string; nama_produk: string; satuan: string } | null;
};

export type PengirimanForInvoice = {
  id: string;
  status: string;
  alamatKirim?: string | null;
  namaKurir?: string | null;
  nomorKurir?: string | null;
  namaPenerima?: string | null;
  nomorPenerima?: string | null;
  nomorSuratJalan?: string | null;
  jenisKendaraan?: string | null;
  warnaKendaraan?: string | null;
  nomorKendaraan?: string | null;
  tanggalMulaiPengiriman?: string | null;
};

export type PenjualanForInvoice = {
  id: string;
  invoice: string;
  total: number;
  biayaKirim?: number | null;
  createdAt: string | Date;
  outlet?: OutletForInvoice | null;
  pelanggan?: { id: string; nama: string; telepon?: string | null; alamat?: string | null } | null;
  createdBy?: { nama: string } | null;
  pengiriman?: PengirimanForInvoice | null;
  detail: DetailItemForInvoice[];
};

export function buildInvoicePenjualanA4Document(input: {
  penjualan: PenjualanForInvoice;
  printedAt?: Date;
  autoPrint?: boolean;
}): string {
  const { penjualan } = input;
  const outlet = penjualan.outlet;
  const outletNama = outlet?.nama ?? "—";
  const outletAlamat = outlet?.alamat?.trim() ?? "";
  const outletTelepon = outlet?.telepon?.trim() ?? "";
  const outletLogo = outlet?.logo?.trim();
  const invoiceNo = penjualan.invoice ?? "—";
  const tanggal = penjualan.createdAt ? formatDate(penjualan.createdAt) : "—";
  const pelangganNama = penjualan.pelanggan?.nama?.trim() ?? "Walk-in";
  const pelangganAlamat = penjualan.pelanggan?.alamat?.trim() ?? "";
  const pelangganTelepon = penjualan.pelanggan?.telepon?.trim() ?? "";
  const createdByNama = penjualan.createdBy?.nama ?? "";

  const subtotal = (penjualan.detail || []).reduce((s, d) => s + Number(d.subtotal ?? 0), 0);
  const biayaKirim = Number(penjualan.biayaKirim ?? 0);
  const total = Number(penjualan.total ?? 0);

  const rowsHtml = (penjualan.detail || [])
    .map((item, i) => {
      const no = i + 1;
      const nama = item.produk?.nama_produk ?? "—";
      const satuan = item.produk?.satuan ?? "";
      const qty = Number(item.jumlah ?? 0);
      const harga = formatCurrency(item.harga ?? 0);
      const sub = formatCurrency(item.subtotal ?? 0);
      return `
    <tr>
      <td style="text-align:center;">${no}</td>
      <td style="text-align:left;">${escapeHtml(nama)}</td>
      <td style="text-align:left;">${escapeHtml(satuan)}</td>
      <td class="right" style="white-space:nowrap;">${qty.toLocaleString("id-ID")}</td>
      <td class="right" style="white-space:nowrap;">${escapeHtml(harga)}</td>
      <td class="right" style="white-space:nowrap;"><strong>${escapeHtml(sub)}</strong></td>
    </tr>`;
    })
    .join("");

  const pengiriman = penjualan.pengiriman;
  const statusLabel = pengiriman ? (STATUS_PENGIRIMAN_LABELS[pengiriman.status] ?? pengiriman.status) : "";

  const pengirimanSection =
    pengiriman ?
      `
    <div class="divider"></div>
    <div class="h2" style="margin-bottom:8px;">INFORMASI PENGIRIMAN</div>
    <div class="box">
      <div class="kv">
        <div class="k">Status</div><div class="v">${escapeHtml(statusLabel)}</div>
        ${pengiriman.nomorSuratJalan ? `<div class="k">No. Surat Jalan</div><div class="v">${escapeHtml(pengiriman.nomorSuratJalan)}</div>` : ""}
        ${pengiriman.alamatKirim ? `<div class="k">Alamat Kirim</div><div class="v" style="text-align:left;">${escapeHtml(pengiriman.alamatKirim)}</div>` : ""}
        ${pengiriman.namaPenerima ? `<div class="k">Penerima</div><div class="v">${escapeHtml(pengiriman.namaPenerima)}</div>` : ""}
        ${pengiriman.nomorPenerima ? `<div class="k">No. Penerima</div><div class="v">${escapeHtml(pengiriman.nomorPenerima)}</div>` : ""}
        ${pengiriman.namaKurir ? `<div class="k">Kurir</div><div class="v">${escapeHtml(pengiriman.namaKurir)}</div>` : ""}
        ${pengiriman.nomorKurir ? `<div class="k">No. Kurir</div><div class="v">${escapeHtml(pengiriman.nomorKurir)}</div>` : ""}
        ${pengiriman.jenisKendaraan ? `<div class="k">Jenis Kendaraan</div><div class="v">${escapeHtml(pengiriman.jenisKendaraan)}</div>` : ""}
        ${pengiriman.warnaKendaraan ? `<div class="k">Warna</div><div class="v">${escapeHtml(pengiriman.warnaKendaraan)}</div>` : ""}
        ${pengiriman.nomorKendaraan ? `<div class="k">Plat Nomor</div><div class="v">${escapeHtml(pengiriman.nomorKendaraan)}</div>` : ""}
        ${pengiriman.tanggalMulaiPengiriman ? `<div class="k">Tgl Mulai Kirim</div><div class="v">${escapeHtml(formatDate(pengiriman.tanggalMulaiPengiriman))}</div>` : ""}
      </div>
    </div>
  `
    : "";

  const bodyHtml = `
    <div class="row" style="align-items:flex-start;">
      <div class="col" style="flex:1;">
        ${outletLogo ? `<img src="${escapeHtml(outletLogo)}" alt="" style="max-height:56px; max-width:200px; object-fit:contain; margin-bottom:8px;" />` : ""}
        <div class="h1" style="margin-bottom:4px;">${escapeHtml(outletNama)}</div>
        ${outletAlamat ? `<div class="muted" style="font-size:13px;">${escapeHtml(outletAlamat)}</div>` : ""}
        ${outletTelepon ? `<div class="muted" style="font-size:13px;">Telp: ${escapeHtml(outletTelepon)}</div>` : ""}
      </div>
      <div class="col" style="text-align:right; flex:0 0 auto;">
        <div class="h1" style="color:#374151;">INVOICE</div>
        <div class="muted" style="margin-top:4px;">No. <span class="mono">${escapeHtml(invoiceNo)}</span></div>
        <div class="muted" style="margin-top:2px;">Tanggal: ${escapeHtml(tanggal)}</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="row">
      <div class="col box">
        <div class="h2">KEPADA / PELANGGAN</div>
        <div class="kv">
          <div class="k">Nama</div><div class="v">${escapeHtml(pelangganNama)}</div>
          ${pelangganTelepon ? `<div class="k">Telepon</div><div class="v">${escapeHtml(pelangganTelepon)}</div>` : ""}
          ${pelangganAlamat ? `<div class="k">Alamat</div><div class="v" style="text-align:left;">${escapeHtml(pelangganAlamat)}</div>` : ""}
        </div>
      </div>
      ${createdByNama ? `<div class="col box" style="flex:0 0 200px;">
        <div class="h2">DIBUAT OLEH</div>
        <div class="v">${escapeHtml(createdByNama)}</div>
      </div>` : ""}
    </div>

    <div class="divider"></div>

    <div class="h2" style="margin-bottom:8px;">RINCIAN BARANG / JASA</div>
    <table>
      <thead>
        <tr>
          <th style="width:36px; text-align:center;">No</th>
          <th style="text-align:left;">Nama Barang</th>
          <th style="text-align:left;">Satuan</th>
          <th class="right">Jumlah</th>
          <th class="right">Harga Satuan</th>
          <th class="right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || `<tr><td colspan="6" class="muted" style="text-align:center; padding:16px;">Tidak ada item</td></tr>`}
      </tbody>
    </table>

    <div class="total">
      <div class="totalBox">
        ${biayaKirim > 0 ? `<div class="totalLine" style="font-weight:600;"><span>Subtotal</span><span>${escapeHtml(formatCurrency(subtotal))}</span></div><div class="totalLine" style="font-size:13px; font-weight:500;"><span>Biaya Kirim</span><span>${escapeHtml(formatCurrency(biayaKirim))}</span></div>` : ""}
        <div class="totalLine" style="margin-top:6px; font-size:15px;"><span>TOTAL</span><span>${escapeHtml(formatCurrency(total))}</span></div>
      </div>
    </div>
    ${pengirimanSection}
  `;

  return buildA4Document({
    title: `Invoice ${invoiceNo}`,
    bodyHtml,
    printedAt: input.printedAt ?? new Date(),
    autoPrint: input.autoPrint,
    showActions: true,
  });
}
