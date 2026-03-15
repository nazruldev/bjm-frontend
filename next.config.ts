import type { NextConfig } from "next";


const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {}, // Pakai Turbopack untuk dev; PWA (webpack) hanya untuk build
};

export default withPWA(nextConfig);
