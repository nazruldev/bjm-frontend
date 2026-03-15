import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { AppLayoutWrapper } from "@/components/app-layout-wrapper";
import { LandscapeGuard } from "@/components/landscape-guard";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BJM",
  description: "Aplikasi manajemen bisnis kemiri - Pembelian, Penjemuran, Pengupasan, Pensortiran",
  applicationName: "BJM",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BJM",
  },
  formatDetection: {
    telephone: false,
    email: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};



export const iframeHeight = "800px";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <AppLayoutWrapper>
              <LandscapeGuard>{children}</LandscapeGuard>
            </AppLayoutWrapper>
          </AuthProvider>
        </QueryProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
