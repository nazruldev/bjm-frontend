/**
 * Setelah next build (standalone), copy .next/static dan public ke dalam
 * folder app di standalone agar server.js bisa melayani /_next/static/* dan public/*
 * Tanpa ini: 404 Not Found untuk chunk JS/CSS.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");
const nextStatic = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");

if (!fs.existsSync(standaloneDir)) {
  console.log("Standalone: .next/standalone tidak ada, skip.");
  process.exit(0);
}

const entries = fs.readdirSync(standaloneDir, { withFileTypes: true });
const appDirName = entries.find((e) => e.isDirectory() && e.name !== "node_modules")?.name;
if (!appDirName) {
  console.log("Standalone: folder app tidak ditemukan, skip.");
  process.exit(0);
}

const appDir = path.join(standaloneDir, appDirName);
const destNext = path.join(appDir, ".next");

if (fs.existsSync(nextStatic)) {
  fs.cpSync(nextStatic, path.join(destNext, "static"), { recursive: true });
  console.log("Standalone: .next/static →", path.join(appDirName, ".next", "static"));
}
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, path.join(appDir, "public"), { recursive: true });
  console.log("Standalone: public →", path.join(appDirName, "public"));
}

console.log("Standalone siap. Jalankan: node server.js dari", appDirName);
