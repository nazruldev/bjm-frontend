type ReceiptBaseOptions = {
  title: string;
  bodyHtml: string;
  widthMm?: number;
  printedAt?: Date;
  autoPrint?: boolean;
  /**
   * Show small action buttons in preview (hidden on print).
   * Keep this true for UX; set false if you want pure receipt-only preview.
   */
  showActions?: boolean;
};

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildReceiptDocument(opts: ReceiptBaseOptions): string {
  const widthMm = opts.widthMm ?? 80;
  const is58 = widthMm <= 58;
  const autoPrint = opts.autoPrint ? "true" : "false";
  const printedAt = opts.printedAt ?? new Date();
  const showActions = opts.showActions !== false;

  const printFontSize = is58 ? 11 : 9;
  const printTinySize = is58 ? 10 : 8;
  const lineHeight = is58 ? 1.35 : 1.25;
  const hrMargin = is58 ? "4px 0" : "8px 0";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(opts.title)}</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        background: #fff;
        color: #000;
         font-family: monospace;
        -webkit-font-smoothing: none;
        font-smooth: never;
      }
      .actions {
        display: ${showActions ? "flex" : "none"};
        gap: 8px;
        justify-content: center;
        padding: 10px 0;
        width: ${widthMm}mm;
        margin: 0 auto;
      }
      button {
        font: inherit;
        font-size: 12px;
        padding: 8px 10px;
        border: 1px solid #000;
        background: #fff;
        cursor: pointer;
      }
      button.primary {
        background: #000;
        color: #fff;
      }
      .paper {
        width: ${widthMm}mm;
        max-width: ${widthMm}mm;
        margin: 0 auto;
        padding: 0 2mm;
      }
      .muted { color: #333; }
      .center { text-align: center; }
      .right { text-align: right; }
      .line { white-space: pre; }
      .wrap { white-space: pre-wrap; word-break: break-word; }
      .hr { border-top: 1px dashed #000; margin: 8px 0; }
      .tiny { font-size: 11px; }
      ${is58 ? ".paper { font-size: 12px; line-height: 1.35; }" : ""}

      @media print {
        .actions { display: none !important; }
        body {
          margin: 0;
          padding: 0;
          font-size: ${printFontSize}px;
          -webkit-font-smoothing: none;
          font-smooth: never;
        }
        .paper {
          width: ${widthMm}mm;
          max-width: ${widthMm}mm;
          margin: 0;
          padding: 0 4mm 0 1mm;
          font-size: ${printFontSize}px;
          line-height: ${lineHeight};
          -webkit-font-smoothing: none;
          font-smooth: never;
        }
        .paper .hr { margin: ${hrMargin}; }
        .tiny { font-size: ${printTinySize}px; }
        @page { size: ${widthMm}mm auto; margin: 0; }
      }
    </style>
  </head>
  <body>
    <div class="actions">
      <button class="primary" onclick="window.__doPrint()">Print</button>
      <button onclick="window.close()">Tutup</button>
    </div>
    <div class="paper">
      ${opts.bodyHtml}
      <div class="hr"></div>
      <div >Dicetak: ${escapeHtml(printedAt.toLocaleString("id-ID"))}</div>
    </div>
    <script>
      (function () {
        var AUTO_PRINT = ${autoPrint};
        async function ready() {
          try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
          await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
        }
        window.__doPrint = async function () {
          await ready();
          try { window.focus(); } catch (e) {}
          window.print();
        };
        if (AUTO_PRINT) window.addEventListener("load", function () { window.__doPrint(); });
      })();
    </script>
  </body>
</html>`;
}

