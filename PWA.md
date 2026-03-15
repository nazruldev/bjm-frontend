# PWA – Cara tes & icon

## Icon (wajib untuk install penuh)

Letakkan dua file di `public/`:

- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

Bisa pakai [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) atau [favicon.io](https://favicon.io/): upload logo, unduh, lalu rename/salin ke `icon-192.png` dan `icon-512.png`.

Tanpa file ini, manifest tetap valid tapi icon di “Add to home screen” bisa kosong/fallback.

## Cara tes PWA

1. **Build production**  
   Next.js 16 pakai Turbopack default; PWA pakai webpack. Wajib pakai flag `--webpack`:
   ```bash
   cd fe
   npx next build --webpack
   npm run start
   ```
   (Opsional: tambah script `"build:pwa": "next build --webpack"` di `package.json`.)

2. **Buka di Chrome**  
   Misal: `http://localhost:3000`

3. **Cek manifest & service worker**
   - F12 → tab **Application**
   - **Manifest**: nama, icon, theme color, start URL
   - **Service Workers**: harus ada `sw.js` (setelah build)

4. **Tes install**
   - Di address bar: ikon “Install” / “Add to app”
   - Atau menu (⋮) → “Install BJM…” / “Add to Home screen”
   - Setelah install, buka dari desktop/home screen seperti app.

5. **Tes offline (opsional)**
   - Di Application → Service Workers → centang **Offline**
   - Refresh; halaman yang sudah di-cache tetap bisa dibuka.

## Catatan

- PWA plugin (`@ducanh2912/next-pwa`) **non-aktif di dev** (`npm run dev`). Service worker hanya ada setelah **production build** (`npm run build` + `npm run start`).
- Untuk tes di HP (HTTPS): deploy ke staging/production atau pakai tunnel (mis. ngrok, Cloudflare Tunnel).
