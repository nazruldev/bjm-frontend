export type NotaPrintData = {
  title?: string;
  content: string[];
  footer?: string;
};

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wrapLine(line: string, maxCols: number): string[] {
  if (line.length <= maxCols) return [line];
  const words = line.split(" ");
  const out: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + word).length > maxCols) {
      if (current.trim()) out.push(current.trimEnd());
      current = word + " ";
    } else {
      current += word + " ";
    }
  }
  if (current.trim()) out.push(current.trimEnd());
  return out.length ? out : [line];
}

export function openNotaPreview(
  data: NotaPrintData,
  opts?: { columns?: number; autoPrint?: boolean; title?: string }
) {
  if (typeof window === "undefined") return;

  const columns = opts?.columns ?? 80; // Epson LX-310 10cpi = 80 cols
  const lines: string[] = [];

  if (data.title) {
    lines.push("=".repeat(columns));
    lines.push(data.title);
    lines.push("=".repeat(columns));
    lines.push("");
  }

  for (const raw of data.content) {
    for (const wrapped of wrapLine(raw, columns)) lines.push(wrapped);
  }

  if (data.footer) {
    lines.push("");
    lines.push("-".repeat(columns));
    for (const wrapped of wrapLine(data.footer, columns)) lines.push(wrapped);
  }

  const pre = escapeHtml(lines.join("\n"));

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(opts?.title ?? data.title ?? "Preview Nota")}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        padding: 12px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        background: #f5f5f5;
      }
      .sheet {
        max-width: 80mm;
        margin: 0 auto;
        background: #fff;
        border: 1px solid #e5e5e5;
        box-shadow: 0 2px 10px rgba(0,0,0,.06);
      }
      .actions {
        display: flex;
        gap: 8px;
        padding: 10px;
        border-bottom: 1px solid #eee;
        position: sticky;
        top: 0;
        background: #fff;
        z-index: 1;
      }
      button {
        font: inherit;
        font-size: 12px;
        padding: 8px 10px;
        border: 1px solid #ddd;
        background: #fff;
        border-radius: 8px;
        cursor: pointer;
      }
      button.primary {
        border-color: #111;
        background: #111;
        color: #fff;
      }
      pre {
        margin: 0;
        padding: 12px;
        font-size: 11px;
        line-height: 1.35;
        white-space: pre-wrap;
        word-break: break-word;
      }
      @media print {
        body { background: #fff; padding: 0; }
        .actions { display: none !important; }
        .sheet { max-width: 80mm; border: none; box-shadow: none; }
        @page { size: 80mm auto; margin: 4mm; }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="actions">
        <button class="primary" onclick="window.print()">Print</button>
        <button onclick="window.close()">Tutup</button>
      </div>
      <pre>${pre}</pre>
    </div>
  </body>
</html>`;

  const w = window.open("", "_blank", "width=520,height=820,noopener,noreferrer");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();

  if (opts?.autoPrint) {
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch {
        // ignore
      }
    }, 250);
  }
}

