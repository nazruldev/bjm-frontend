type A4BaseOptions = {
  title: string;
  bodyHtml: string;
  printedAt?: Date;
  autoPrint?: boolean;
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

export function buildA4Document(opts: A4BaseOptions): string {
  const autoPrint = opts.autoPrint ? "true" : "false";
  const printedAt = opts.printedAt ?? new Date();
  const showActions = opts.showActions !== false;

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
        background: #f3f4f6;
        color: #111;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }
      .actions {
        display: ${showActions ? "flex" : "none"};
        gap: 8px;
        justify-content: center;
        padding: 12px;
      }
      button {
        font: inherit;
        font-size: 13px;
        padding: 8px 12px;
        border: 1px solid #111;
        background: #fff;
        cursor: pointer;
        border-radius: 8px;
      }
      button.primary {
        background: #111;
        color: #fff;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 12px auto;
        background: #fff;
        border: 1px solid #e5e7eb;
        box-shadow: 0 4px 18px rgba(0,0,0,.06);
        padding: 14mm 14mm 16mm;
      }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      .muted { color: #6b7280; }
      .h1 { font-size: 20px; font-weight: 800; margin: 0; }
      .h2 { font-size: 12px; font-weight: 700; margin: 0 0 8px; letter-spacing: .4px; }
      .row { display: flex; gap: 16px; justify-content: space-between; align-items: flex-start; }
      .col { flex: 1; }
      .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
      .kv { display: grid; grid-template-columns: 140px 1fr; gap: 6px 10px; font-size: 13px; }
      .k { color: #374151; }
      .v { text-align: right; }
      .divider { height: 1px; background: #e5e7eb; margin: 14px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 6px; }
      th { text-align: left; color: #374151; font-weight: 700; }
      th.right, td.right { text-align: right; }
      .total {
        margin-top: 10px;
        display: flex;
        justify-content: flex-end;
      }
      .totalBox {
        min-width: 260px;
        border: 1px solid #111;
        border-radius: 10px;
        padding: 10px 12px;
      }
      .totalLine { display: flex; justify-content: space-between; gap: 12px; font-weight: 800; }
      .footer { margin-top: 18px; display: flex; justify-content: space-between; gap: 18px; }
      .sign { flex: 1; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px; height: 80px; }

      @media print {
        body { background: #fff; }
        .actions { display: none !important; }
        .page { margin: 0; border: none; box-shadow: none; }
        @page { size: A4; margin: 12mm; }
      }
    </style>
  </head>
  <body>
    <div class="actions">
      <button class="primary" onclick="window.__doPrint()">Print A4</button>
      <button onclick="window.close()">Tutup</button>
    </div>
    <div class="page">
      ${opts.bodyHtml}
      <div class="divider"></div>
      <div class="muted" style="font-size:12px;">
        Dicetak: <span class="mono">${escapeHtml(printedAt.toLocaleString("id-ID"))}</span>
      </div>
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

