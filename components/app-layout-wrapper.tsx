"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOutlets } from "@/hooks/useOutlets";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { LockscreenProvider } from "@/components/lockscreen-provider";
import { ConfirmPasswordProvider } from "@/components/dialog-confirm-password";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const INSPECTOR_ALLOWED_PATHS = ["/", "/pembelian", "/penjemuran", "/pengupasan"];

function isInspectorAllowed(path: string | null): boolean {
  if (!path) return true;
  return INSPECTOR_ALLOWED_PATHS.some(
    (allowed) => path === allowed || path.startsWith(allowed + "/")
  );
}

/** OWNER tanpa outlet hanya boleh akses Beranda (/) dan Outlet (/outlet) */
const OWNER_NO_OUTLET_ALLOWED_PATHS = ["/", "/outlet"];

function isOwnerNoOutletAllowed(path: string | null): boolean {
  if (!path) return true;
  return OWNER_NO_OUTLET_ALLOWED_PATHS.some(
    (allowed) => path === allowed || path.startsWith(allowed + "/")
  );
}

export function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isOwner = user?.role === "OWNER";
  const { data: outletsData, isFetched: outletsFetched } = useOutlets(
    { limit: 1 },
    { enabled: isOwner && !!user }
  );
  const ownerHasNoOutlets = isOwner && outletsFetched && (outletsData?.data?.length ?? 0) === 0;

  const showInitialLoading =
    isLoading || (isOwner && !!user && !outletsFetched);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Hanya tampilkan overlay setelah mount agar SSR dan client render sama (hindari hydration mismatch)
  const showOverlay = mounted && showInitialLoading;

  // Inspector hanya boleh akses: Beranda, Pembelian, Penjemuran, Pemfilteran, Pengupasan
  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role === "INSPECTOR" && !isInspectorAllowed(pathname)) {
      router.replace("/");
    }
  }, [user?.role, pathname, isLoading, router]);

  // OWNER tanpa outlet (setelah data outlet selesai di-fetch): hanya boleh akses / dan /outlet
  useEffect(() => {
    if (!ownerHasNoOutlets || !pathname) return;
    if (!isOwnerNoOutletAllowed(pathname)) {
      router.replace("/outlet");
    }
  }, [ownerHasNoOutlets, pathname, router]);

  // Route yang tidak perlu sidebar/header (auth routes)
  const isAuthRoute = pathname?.startsWith("/login") ||
                      pathname?.startsWith("/register") ||
                      pathname?.startsWith("/auth");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Untuk route utama, render dengan sidebar dan header
  return (
   <div className="relative">
     {showOverlay && (
       <div
         className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm"
         aria-busy="true"
         aria-label="Memuat"
       >
         <Loader2 className="size-10 animate-spin text-primary" />
         <p className="text-sm font-medium text-muted-foreground">
           {isOwner && user && !outletsFetched ? "Memuat outlet..." : "Memuat..."}
         </p>
       </div>
     )}

     <LockscreenProvider>
      <ConfirmPasswordProvider>
      <div className="[--header-height:calc(--spacing(14))]">
        <SidebarProvider className="flex flex-col">
          <SiteHeader />
          <div className="flex flex-1">
            <AppSidebar />
            <SidebarInset>
              <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="w-full mx-auto max-w-7xl rounded-xl">
                  {children}
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
      </ConfirmPasswordProvider>
    </LockscreenProvider>
   </div>
  );
}
