/**
 * Konfigurasi Lockscreen
 * Waktu dalam milidetik (default: 5 menit = 300000 ms)
 */
export const lockscreenConfig = {
  /**
   * Waktu idle (tidak ada aktivitas) sebelum lockscreen muncul
   * Default: 5 menit (300000 ms)
   */
  idleTimeout: 5 * 60 * 1000, // 5 menit dalam milidetik

  /**
   * Apakah lockscreen diaktifkan
   */
  enabled: true,
};
