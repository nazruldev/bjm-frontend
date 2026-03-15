export function openPrintPreviewDocument(
  htmlDocument: string,
  opts?: {
    /**
     * If true, will trigger print after content is ready.
     * Note: popup must be allowed by browser.
     */
    autoPrint?: boolean;
    /**
     * Window title shown in tab (best-effort).
     */
    title?: string;
    /**
     * Window open features.
     */
    features?: string;
  }
): void {
  if (typeof window === "undefined") return;

  // Use Blob URL to avoid flaky document.write/blank preview issues.
  const blob = new Blob([htmlDocument], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const w = window.open(
    url,
    "_blank",
    opts?.features ?? "width=520,height=820"
  );
  if (!w) {
    URL.revokeObjectURL(url);
    return;
  }

  // Best-effort: revoke blob URL once loaded.
  try {
    w.addEventListener(
      "load",
      () => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      },
      { once: true }
    );
  } catch {
    // ignore
  }

  // Title is already inside htmlDocument; this is best-effort only.
  if (opts?.title) {
    try {
      w.document.title = opts.title;
    } catch {
      // ignore
    }
  }

  if (opts?.autoPrint) {
    // Wait for window to finish loading, then print.
    const doPrint = () => {
      setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch {
          // ignore
        }
      }, 150);
    };

    try {
      w.addEventListener("load", doPrint, { once: true });
    } catch {
      // Fallback if load listener fails
      doPrint();
    }
  }
}

