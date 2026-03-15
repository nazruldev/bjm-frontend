import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BJM",
    short_name: "BJM",
    description: "Aplikasi manajemen bisnis kemiri",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    theme_color: "#000000",
    background_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
