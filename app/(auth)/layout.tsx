import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - BJM",
  description: "Authentication pages for BJM system",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Layout ini hanya untuk override metadata
  // Sidebar/header sudah di-handle oleh AppLayoutWrapper di root layout
  return <>{children}</>;
}
