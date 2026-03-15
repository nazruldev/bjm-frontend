import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Tanggal hari ini dalam format YYYY-MM-DD (waktu lokal, bukan UTC).
 * Pakai ini untuk default "hari ini" agar tidak salah di timezone Indonesia.
 */
export function getTodayDateString(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Ambil bagian tanggal saja YYYY-MM-DD dari value (waktu lokal).
 * - string "YYYY-MM-DD" atau ISO → diambil 10 karakter pertama (tanggal lokal jika ISO).
 * - Date → getFullYear/getMonth/getDate (lokal), bukan toISOString (UTC).
 */
export function toLocalDateStringOnly(
  value: string | Date | null | undefined
): string {
  if (value == null) return "";
  if (typeof value === "string") {
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const d = value as Date;
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Format Date ke string "YYYY-MM-DDTHH:mm:ss" waktu lokal (tanpa Z).
 * Untuk kirim ke API agar server menginterpretasi sebagai waktu lokal.
 */
export function toLocalDateTimeISO(value: Date): string {
  const d = value;
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}:${s}`;
}

/**
 * Format date with validation
 * Handles invalid dates and returns "-" for invalid/null dates
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "-";
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return "-";
    }
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return dateObj.toLocaleDateString("id-ID", options || defaultOptions);
  } catch {
    return "-";
  }
}

/**
 * Format tanggal + jam (untuk tampilan detail)
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "-";
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "-";
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return dateObj.toLocaleString("id-ID", options || defaultOptions);
  } catch {
    return "-";
  }
}

/**
 * Format jumlah dengan satuan (untuk input jumlah produk)
 * Handles string and number values, returns formatted string with thousand separators
 * Similar to formatCurrency but supports decimals (max 2 decimal places)
 */
export function formatJumlah(value: string | number): string {
  if (!value && value !== 0) return "";
  const numValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^\d.]/g, ""))
      : value;
  if (isNaN(numValue)) return "";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })
    .format(numValue)
    .replace(/\.?0+$/, ""); // Remove trailing zeros and decimal point if all zeros
}

/**
 * Format number with 2 decimal places but remove trailing zeros
 * Example: 100.00 -> "100", 50.50 -> "50.5", 25.25 -> "25.25"
 */
export function formatDecimal(value: number | string): string {
  if (value === null || value === undefined || value === "") return "";

  const numValue =
    typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) return "";

  return numValue.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}



export function formatKg(value: number | string): string {
  const num =
    typeof value === "string"
      ? parseFloat(value)
      : value;

  if (isNaN(num)) return "";

  return num.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

/** Format jumlah kg seperti tampilan JumlahKgInput: id-ID, max 3 desimal */
export function formatJumlahKg(value: number | string): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}
/**
 * Parse jumlah value (remove formatting)
 * Removes all non-digit and non-decimal characters
 */
export function parseJumlah(value: string): string {
  return value.replace(/[^\d.]/g, "");
}

/**
 * Parse currency value (remove formatting)
 * Removes all non-digit characters
 */
export function parseCurrency(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/**
 * Format currency IDR (tanpa prefix Rp)
 */
/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function formatCurrency(value: string | number): string {
  if (!value) return "";
  const numValue =
    typeof value === "string" ? parseFloat(value.replace(/[^\d]/g, "")) : value;
  if (isNaN(numValue)) return "";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

export const parseNumberID = (value: string) => {
  if (!value) return 0;
  return parseFloat(
    value
      .replace(/\./g, "")  // hapus ribuan (id-ID: 123.000 = 123000)
      .replace(",", ".")   // ubah desimal (id-ID: 123,5 = 123.5)
  ) || 0;
};

/**
 * Parse jumlah/qty yang bisa format id-ID (titik ribuan) atau en (koma ribuan).
 * "123.000" -> 123000, "123,000" -> 123000, "123,5" -> 123.5
 */
export function parseJumlahID(value: string): number {
  if (!value || !value.trim()) return 0;
  const trimmed = value.trim();
  // Jika ada koma: bagian setelah koma terakhir hanya nol (000, 00, 0) = koma ribuan (en)
  const lastComma = trimmed.lastIndexOf(",");
  if (lastComma !== -1) {
    const afterComma = trimmed.slice(lastComma + 1);
    if (/^0+$/.test(afterComma)) {
      // "123,000" -> hapus koma ribuan
      const withoutComma = trimmed.replace(/,/g, "");
      return parseFloat(withoutComma.replace(/\./g, "")) || 0;
    }
    // "123,5" -> koma desimal (id-ID)
    return parseFloat(trimmed.replace(/\./g, "").replace(",", ".")) || 0;
  }
  // Hanya titik atau angka: titik = ribuan (id-ID)
  return parseFloat(trimmed.replace(/\./g, "")) || 0;
}