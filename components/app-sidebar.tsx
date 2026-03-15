/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import {
  Command,
  SquareTerminal,
  Wallet2,
  Package2,
  KeyboardMusic,
  WalletCards,
  HandCoins,
  ShoppingBag,
  FileText,
  CoinsIcon,
  Database,
  HomeIcon,
  Building2Icon,
  Wrench,
  CalendarCheck2,
  Settings,
  Clock,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { NavMain } from "./nav-main";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOutlet, useOutlets } from "@/hooks/useOutlets";

const SELECTED_OUTLET_KEY = "selectedOutletId";

/** Menu Inspector: hanya Pembelian, Penjemuran, Pengupasan */
const inspectorNavMain = [
  { title: "Beranda", url: "/", icon: HomeIcon },
  { title: "Pembelian", url: "/pembelian", icon: ShoppingBag },
  { title: "Penjemuran", url: "/penjemuran", icon: KeyboardMusic },
  { title: "Pengupasan", url: "/pengupasan", icon: Package2 },
];

const data = {
  navMain: [
    {
      title: "Beranda",
      url: "/",
      icon: HomeIcon,
    },
    {
      title: "Outlet",
      url: "/outlet",
      icon: Building2Icon,
      role: ["OWNER"],
    },
    {
      title: "Master",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Pengguna",
          url: "/pengguna",
          role: ["OWNER"],
        },
        {
          title: "Pemasok",
          url: "/pemasok",
        },
        {
          title: "Pelanggan",
          url: "/pelanggan",
        },
        {
          title: "Karyawan",
          url: "/karyawan",
        },
        {
          title: "Pekerja",
          url: "/pekerja",
        },
        {
          title: "Tarif Gaji Karyawan",
          url: "/gaji",
          role: ["OWNER"],
        },
        {
          title: "Tarif Pekerja",
          url: "/tarif-pekerja",
          role: ["OWNER", "ADMIN"],
        },

        {
          title: "Rekening",
          url: "/rekening",
          role: ["OWNER"],
        },
      ],
    },
    {
      title: "Data Produk",
      role: ["OWNER"],
      url: "#",
      icon: Package2,
      isActive: true,
      items: [
        {
          title: "Produk",
          url: "/produk",
        },

        {
          title: "Stok",
          url: "/mutasi-stok",
        },


      ],
    },
    {
      title: "Jual Beli",

      url: "#",
      icon: ShoppingBag,
      isActive: true,
      items: [
        {
          title: "Pembelian",
          url: "/pembelian",
        },
        {
          role: ["OWNER", "ADMIN"],
          title: "Penjualan",
          url: "/penjualan",
        },
        {
          role: ["OWNER", "ADMIN"],
          title: "Pengiriman",
          url: "/pengiriman",
        },
      ],
    },
    {
      title: "Produksi",

      url: "#",
      icon: KeyboardMusic,
      isActive: true,
      items: [

        {
          title: "Penjemuran",
          url: "/penjemuran",
        },
        {
          title: "Pengupasan",
          url: "/pengupasan",
        },
        {
          title: "Pensortiran",
          url: "/pensortiran",
        },


      ],
    },

    {
      title: "Hutang & Kasbon",
      role: ["OWNER", "ADMIN"],
      url: "#",
      icon: WalletCards,
      isActive: true,
      items: [
        {
          title: "Kasbon",
          url: "/piutang",


        },
        {
          title: "Hutang Usaha",
          url: "/hutang",


        },


      ],
    },
    {
      title: "Penggajian",
      role: ["OWNER", "ADMIN"],
      url: "/penggajian",
      icon: HandCoins,
      isActive: true,
    },
    {

      role: ["OWNER", "ADMIN"],
      title: "Absensi",
      url: "/absensi",
      icon: CalendarCheck2,
      isActive: true,
    },


    {
      role: ["OWNER", "ADMIN"],
      title: "Keuangan",
      url: "/keuangan",
      icon: CoinsIcon,
    },
    {
      role: ["OWNER", "ADMIN"],
      title: "Approval Cashless",
      url: "/pending-approval",
      icon: Clock,
    },
    {
      role: ["OWNER"],
      title: "Pembayaran",
      url: "/pembayaran",
      icon: Wallet2,
    },
    {
      role: ["OWNER","ADMIN"],
      title: "Laporan",
      url: "/laporan",
      icon: FileText,
    },
    {
      role: ["OWNER", "ADMIN"],
      title: "Tools",
      url: "#",
      icon: Wrench,
      isActive: true,
      items: [
        {
          title: "Generate Nota",
          url: "/tools/generate-invoice",
        },
        {
          title: "Device ACS",
          url: "/tools/device-acs",
        },
        {
          title: "Sync Absensi Log",
          url: "/tools/sync-absensi-log",
        },
      ],
    },
    {
      role: ["OWNER"],
      title: "Pengaturan",
      url: "/setting",
      icon: Settings,
    },
    {
      role: ["OWNER"],
      title: "Database",
      url: "/database",
      icon: Database,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [selectedOutlet, setSelectedOutlet] = React.useState("");

  const isOwner = user?.role === "OWNER";
  const { data: outletsData } = useOutlets(
    { limit: 1000 },
    { enabled: isOwner && !!user }
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);
  React.useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem(SELECTED_OUTLET_KEY) || "";
      if (saved) setSelectedOutlet(saved);
    } catch {
      // ignore
    }
  }, [mounted]);

  // OWNER tanpa outlet terpilih: pilih outlet pertama (sinkron dengan site-header)
  React.useEffect(() => {
    if (!mounted || !isOwner || !outletsData?.data?.length || selectedOutlet) return;
    const firstId = outletsData.data[0].id;
    setSelectedOutlet(firstId);
    try {
      localStorage.setItem(SELECTED_OUTLET_KEY, firstId);
    } catch {
      // ignore
    }
  }, [mounted, isOwner, outletsData?.data, selectedOutlet]);

  const activeOutletId =
    user?.role === "OWNER" ? selectedOutlet || null : user?.outletId || null;
  const { data: currentOutletData } = useCurrentOutlet(activeOutletId, {
    enabled: !!user && (user?.role !== "OWNER" || !!selectedOutlet),
  });
  const currentOutlet = currentOutletData?.data ?? user?.outlet ?? null;

  // OWNER tanpa outlet: hanya boleh akses Beranda & Outlet (halaman buat outlet perdana)
  const hasOutlets = !isOwner || (outletsData?.data?.length ?? 0) > 0;

  // Master: ADMIN/OWNER dapat semua; KASIR hanya Karyawan, Pemasok, Pekerja (+ Tools Generate)
  const MASTER_ALL_URLS = ["/pemasok", "/karyawan", "/pekerja"];

  // Menu yang hanya untuk ADMIN/OWNER (sembunyikan dari KASIR agar tidak salah klik)
  const ADMIN_ONLY_MENU_TITLES = [
    "Outlet",
    "Database",
    "Hutang & Kasbon",
    "Penggajian",
    "Keuangan",
    "Menunggu Approval",
    "Pembayaran",
    "Laporan",
  ];

  const userRole = user?.role ?? "";

  // URL yang boleh tampil ketika OWNER belum punya outlet (hanya Beranda + Outlet)
  const OWNER_NO_OUTLET_ALLOWED_URLS = ["/", "/outlet"];

  // Filter menu berdasarkan role user (termasuk property `role` di tiap item)
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filteredNavMain = React.useMemo(() => {
    if (userRole === "INSPECTOR") {
      return inspectorNavMain;
    }
    const isOwnerRole = userRole === "OWNER";
    const isAdmin = userRole === "ADMIN";
    const isKasir = userRole === "KASIR";

    let list = data.navMain
      .filter((item: any) => {
        if (isOwnerRole) return true;
        if (item.title === "Outlet" || item.title === "Database") {
          return false;
        }
        if (isKasir && ADMIN_ONLY_MENU_TITLES.includes(item.title)) {
          return false;
        }
        if (item.role && Array.isArray(item.role)) {
          return item.role.includes(userRole);
        }
        return true;
      })
      .map((item: any) => {
        if (item.title !== "Master" || !item.items) return item;
        let items = item.items;
        if (isOwnerRole) {
          items = item.items;
        } else if (isAdmin) {
          items = items.filter((sub: any) => {
            if (sub.role && Array.isArray(sub.role)) return sub.role.includes(userRole);
            return true;
          });
        } else {
          items = items.filter((sub: any) => {
            if (sub.role && Array.isArray(sub.role)) return sub.role.includes(userRole);
            return MASTER_ALL_URLS.some((u) => sub.url?.startsWith(u) || sub.url === u);
          });
        }
        return { ...item, items };
      });

    // OWNER tanpa outlet: hanya tampilkan Beranda dan Outlet
    if (isOwnerRole && !hasOutlets) {
      list = list.filter((item: any) => {
        if (item.url && OWNER_NO_OUTLET_ALLOWED_URLS.includes(item.url)) return true;
        return false;
      });
    }

    return list;
  }, [userRole, hasOutlets]);

  // Transform user data untuk NavUser
  const userData = React.useMemo(() => {
    if (!user) {
      return {
        nama: "",
        email: "",
        avatar: undefined,
        initials: "",
      };
    }
    // Backend mengembalikan 'nama', bukan 'name'
    const userNama = (user as any).nama || user.name || "";

    // Ambil inisial dari nama untuk avatar fallback
    const getInitials = (name: string) => {
      if (!name) return "";
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    return {
      nama: userNama,
      email: user.email || "",
      avatar: undefined, // Bisa ditambahkan jika ada field avatar di User
      initials: getInitials(userNama),
    };
  }, [user]);

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild suppressHydrationWarning>
              <a href="#" className="">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Building2Icon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {currentOutlet?.nama || (hasOutlets ? "Outlet" : "-")}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {currentOutlet?.alamat || (hasOutlets ? "-" : "-")}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />

      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
