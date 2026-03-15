"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  X,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JumlahKgInput } from "@/components/ui/jumlah-kg-input";
import { useConfirmPassword } from "@/components/dialog-confirm-password";
import {
  formatCurrency,
  formatJumlah,
  formatJumlahKg,
  parseCurrency,
  parseJumlah,
  parseJumlahID,
  parseNumberID,
  getTodayDateString,
} from "@/lib/utils";
import type { Produk } from "@/services/produkService";
import type {
  CreatePembelianDto,
  Pembelian,
} from "@/services/pembelianService";
import type { CreatePemasokDto } from "@/services/pemasokService";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CartItem {
  id: string; // Unique ID: kombinasi produkId + harga
  produkId: string;
  produk: Produk;
  jumlah: number;
  harga: number | null;
  subtotal: number;
}

interface PembelianPOSProps {
  produkList: Produk[];
  pemasokOptions: { value: string; label: string }[];
  rekeningOptions: { value: string; label: string }[];
  /** Quick tambah pemasok dari POS; jika diset, tombol "Tambah pemasok" ditampilkan */
  onQuickAddPemasok?: (data: CreatePemasokDto) => Promise<{ id: string }>;
  onSubmit: (
    data: CreatePembelianDto & {
      isCashless: boolean;
      rekeningId?: string | null;
      ongkosBongkarTimbang?: number;
    },
  ) => Promise<void>;
  isLoading?: boolean;
}

type PembelianPOSPayload = CreatePembelianDto & {
  isCashless: boolean;
  rekeningId?: string | null;
  ongkosBongkarTimbang?: number;
  jumlahBayar?: number;
};

export function PembelianPOS({
  produkList,
  pemasokOptions,
  rekeningOptions,
  onQuickAddPemasok,
  onSubmit,
  isLoading = false,
}: PembelianPOSProps) {
  const { user } = useAuth();
  const userId = user?.id || "guest";
  const { openConfirmPassword } = useConfirmPassword();
  const pendingPayloadRef = React.useRef<PembelianPOSPayload | null>(null);

  // Helper untuk localStorage key berdasarkan user ID
  const getStorageKey = (key: string) => `pembelian_pos_${key}_${userId}`;

  // Load cart dari localStorage saat mount
  const loadCartFromStorage = React.useCallback((): CartItem[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(getStorageKey("cart"));
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // Map produk data dari produkList
      return parsed
        .map((item: any) => {
          const produk = produkList.find((p) => p.id === item.produkId);
          if (!produk) return null;
          return {
            ...item,
            produk,
          };
        })
        .filter((item: CartItem | null): item is CartItem => item !== null);
    } catch {
      return [];
    }
  }, [userId, produkList]);

  // Save cart ke localStorage
  const saveCartToStorage = React.useCallback(
    (cartData: CartItem[]) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(getStorageKey("cart"), JSON.stringify(cartData));
      } catch (error) {
        console.error("Failed to save cart to localStorage", error);
      }
    },
    [userId],
  );

  // Load checkout data dari localStorage
  const loadCheckoutFromStorage = React.useCallback(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(getStorageKey("checkout"));
      if (!stored) return {};
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }, [userId]);

  // Save checkout data ke localStorage
  const saveCheckoutToStorage = React.useCallback(
    (data: any) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(getStorageKey("checkout"), JSON.stringify(data));
      } catch (error) {
        console.error("Failed to save checkout to localStorage", error);
      }
    },
    [userId],
  );

  const [searchQuery, setSearchQuery] = React.useState("");
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [productListDialogOpen, setProductListDialogOpen] =
    React.useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = React.useState(false);
  const [selectedProduk, setSelectedProduk] = React.useState<Produk | null>(
    null,
  );
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [dialogJumlah, setDialogJumlah] = React.useState<string>("1");
  const [dialogHarga, setDialogHarga] = React.useState<string>("");
  const [pemasokId, setPemasokId] = React.useState<string>("");
  const [createdAt, setCreatedAt] = React.useState<string>(() =>
    getTodayDateString(),
  );
  const [isCashless, setIsCashless] = React.useState(false);
  const [rekeningId, setRekeningId] = React.useState<string>("");
  const [ongkosBongkarTimbang, setOngkosBongkarTimbang] =
    React.useState<string>("");
  const [jumlahBayar, setJumlahBayar] = React.useState<string>("");
  const [catatan, setCatatan] = React.useState<string>("");
  const [quickAddPemasokOpen, setQuickAddPemasokOpen] = React.useState(false);
  const [quickAddNama, setQuickAddNama] = React.useState("");
  const [quickAddTelepon, setQuickAddTelepon] = React.useState("");
  const [quickAddAlamat, setQuickAddAlamat] = React.useState("");
  const [quickAddSubmitting, setQuickAddSubmitting] = React.useState(false);

  // Load data dari localStorage saat mount
  React.useEffect(() => {
    if (produkList.length > 0) {
      // Load dari localStorage
      const loadedCart = loadCartFromStorage();
      setCart(loadedCart);

      const loadedCheckout = loadCheckoutFromStorage();
      setPemasokId(loadedCheckout.pemasokId || "");
      setCreatedAt(
        typeof loadedCheckout.createdAt === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(loadedCheckout.createdAt)
          ? loadedCheckout.createdAt
          : getTodayDateString(),
      );
      setIsCashless(loadedCheckout.isCashless || false);
      setRekeningId(loadedCheckout.rekeningId || "");
      setOngkosBongkarTimbang(loadedCheckout.ongkosBongkarTimbang || "");
      setJumlahBayar(parseCurrency(String(loadedCheckout.jumlahBayar || "")));
      setCatatan(loadedCheckout.catatan || "");
    }
  }, [produkList.length, loadCartFromStorage, loadCheckoutFromStorage]);

  // Save cart ke localStorage setiap kali cart berubah
  React.useEffect(() => {
    if (cart.length > 0 || cart.length === 0) {
      saveCartToStorage(cart);
    }
  }, [cart, saveCartToStorage]);

  // Save checkout data ke localStorage setiap kali berubah
  React.useEffect(() => {
    saveCheckoutToStorage({
      pemasokId,
      createdAt,
      isCashless,
      rekeningId,
      ongkosBongkarTimbang,
      jumlahBayar,
      catatan,
    });
  }, [
    pemasokId,
    createdAt,
    isCashless,
    rekeningId,
    ongkosBongkarTimbang,
    jumlahBayar,
    catatan,
    saveCheckoutToStorage,
  ]);

  // Reset rekeningId jika pilihan tidak ada di daftar (mis. ganti outlet atau rekening dinonaktifkan)
  React.useEffect(() => {
    if (!rekeningId || rekeningOptions.length === 0) return;
    const exists = rekeningOptions.some((opt) => opt.value === rekeningId);
    if (!exists) setRekeningId("");
  }, [rekeningId, rekeningOptions]);

  // Filter produk berdasarkan search
  const filteredProduk = React.useMemo(() => {
    if (!searchQuery) return produkList;
    const query = searchQuery.toLowerCase();
    return produkList.filter(
      (p) =>
        p.nama_produk.toLowerCase().includes(query) ||
        p.satuan.toLowerCase().includes(query),
    );
  }, [produkList, searchQuery]);

  // Hitung total pembelian (dari cart)
  const totalPembelian = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  // Hitung total akhir (pembelian - ongkos)
  const totalAkhir = React.useMemo(() => {
    const ongkos = parseFloat(parseCurrency(ongkosBongkarTimbang || "0")) || 0;
    const calculated = totalPembelian - ongkos;
    return Math.max(0, calculated); // Pastikan total tidak negatif
  }, [totalPembelian, ongkosBongkarTimbang]);

  // Auto-adjust: default Jumlah Bayar = Total Akhir (min 0). Walk-in = lunas. Ada pemasok: bila kosong isi default total; bila user isi 0 tetap 0.
  React.useEffect(() => {
    const isWalkIn =
      !pemasokId || pemasokId === "__walkin__" || pemasokId === "__none__";
    const currentJumlahBayar =
      parseFloat(parseCurrency(jumlahBayar || "0")) || 0;

    if (totalAkhir === 0) {
      if (currentJumlahBayar !== 0) setJumlahBayar("0");
    } else if (isWalkIn) {
      if (currentJumlahBayar !== totalAkhir) setJumlahBayar(String(totalAkhir));
    } else if (currentJumlahBayar > totalAkhir && currentJumlahBayar > 0) {
      setJumlahBayar(String(totalAkhir));
    } else if (jumlahBayar.trim() === "" && totalAkhir > 0) {
      setJumlahBayar(String(totalAkhir));
    }
  }, [totalAkhir, pemasokId]);

  // Buka dialog list produk
  const handleOpenProductListDialog = () => {
    setProductListDialogOpen(true);
  };

  // Pilih produk dari list, lalu buka dialog input jumlah/harga
  const handleSelectProduct = (produk: Produk) => {
    setSelectedProduk(produk);
    setEditingItemId(null); // Reset editing item ID saat tambah produk baru
    setDialogJumlah("1");
    setDialogHarga("");
    setProductListDialogOpen(false);
    setAddProductDialogOpen(true);
  };

  // Generate unique ID untuk cart item (produkId + harga)
  const generateCartItemId = (
    produkId: string,
    harga: number | null,
  ): string => {
    return `${produkId}_${harga ?? "null"}`;
  };

  // Tambah produk ke cart dari dialog
  const handleAddProductFromDialog = () => {
    if (!selectedProduk) {
      setAddProductDialogOpen(false);
      return;
    }

    const jumlah = parseJumlahID(dialogJumlah) || 1;
    const harga = dialogHarga ? parseFloat(parseCurrency(dialogHarga)) : null;
    const subtotal = jumlah * (harga || 0);
    const itemId = generateCartItemId(selectedProduk.id, harga);

    // Cek apakah sudah ada item dengan produkId DAN harga yang sama
    const existingItem = cart.find(
      (item) => item.produkId === selectedProduk.id && item.harga === harga,
    );

    if (existingItem) {
      // Update jumlah jika produkId dan harga sama
      setCart(
        cart.map((item) =>
          item.id === existingItem.id
            ? {
                ...item,
                jumlah: item.jumlah + jumlah,
                subtotal: (item.jumlah + jumlah) * (harga || 0),
              }
            : item,
        ),
      );
    } else {
      // Tambah item baru (karena harga berbeda atau belum ada)
      const newItem: CartItem = {
        id: itemId,
        produkId: selectedProduk.id,
        produk: selectedProduk,
        jumlah,
        harga,
        subtotal,
      };
      setCart([...cart, newItem]);
    }

    setAddProductDialogOpen(false);
    setSelectedProduk(null);
    setEditingItemId(null);
  };

  // Edit item di cart (buka dialog)
  const handleEditCartItem = (item: CartItem) => {
    setSelectedProduk(item.produk);
    setEditingItemId(item.id);
    setDialogJumlah(String(item.jumlah));
    setDialogHarga(item.harga ? formatCurrency(item.harga) : "");
    setAddProductDialogOpen(true);
  };

  // Update item dari dialog edit
  const handleUpdateProductFromDialog = () => {
    if (!selectedProduk || !editingItemId) {
      setAddProductDialogOpen(false);
      return;
    }

    // Cari item yang sedang di-edit dulu (untuk fallback harga)
    const editingItem = cart.find((item) => item.id === editingItemId);
    if (!editingItem) {
      setAddProductDialogOpen(false);
      setSelectedProduk(null);
      setEditingItemId(null);
      return;
    }

    // Jumlah: parseJumlahID supaya 123.000 dan 123,000 = 123000; 123,5 = 123.5
    const jumlah = parseJumlahID(dialogJumlah) || 1;
    // Harga: kalau kosong saat edit, pakai harga item yang sedang diedit
    const hargaParsed = dialogHarga
      ? parseFloat(parseCurrency(dialogHarga))
      : null;
    const harga = hargaParsed ?? editingItem.harga ?? null;
    const subtotal = jumlah * (harga ?? 0);
    const newItemId = generateCartItemId(selectedProduk.id, harga);

    if (editingItem.id === newItemId) {
      // Jika harga tidak berubah, update item yang sama
      setCart(
        cart.map((item) =>
          item.id === editingItemId
            ? { ...item, jumlah, harga, subtotal }
            : item,
        ),
      );
    } else {
      // Jika harga berubah, hapus item lama dan tambah item baru
      const newCart = cart.filter((item) => item.id !== editingItemId);

      // Tambah item baru dengan harga baru
      const newItem: CartItem = {
        id: newItemId,
        produkId: selectedProduk.id,
        produk: selectedProduk,
        jumlah,
        harga,
        subtotal,
      };
      setCart([...newCart, newItem]);
    }

    setAddProductDialogOpen(false);
    setSelectedProduk(null);
    setEditingItemId(null);
  };

  // Hapus item dari cart
  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  // Clear cart
  const handleClearCart = () => {
    setCart([]);
    setPemasokId("");
    setCreatedAt(getTodayDateString());
    setIsCashless(false);
    setRekeningId("");
    setOngkosBongkarTimbang("");
    setJumlahBayar("");
    setCatatan("");
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(getStorageKey("cart"));
      localStorage.removeItem(getStorageKey("checkout"));
    }
  };

  // Handle submit checkout
  const handleSubmitCheckout = async () => {
    if (cart.length === 0) {
      return;
    }

    // Validasi jika cashless, harus ada rekening
    if (isCashless && !rekeningId) {
      return;
    }

    // Validasi jumlahBayar tidak boleh melebihi totalAkhir
    const currentJumlahBayar =
      parseFloat(parseCurrency(jumlahBayar || "0")) || 0;
    if (currentJumlahBayar > totalAkhir) {
      return; // Akan di-handle oleh auto-adjust, tapi double check
    }

    // Validasi: Jika walk-in (tidak ada pemasok), harus lunas (jumlahBayar = totalAkhir)
    const isWalkIn =
      !pemasokId || pemasokId === "__walkin__" || pemasokId === "__none__";
    if (isWalkIn && currentJumlahBayar > 0 && currentJumlahBayar < totalAkhir) {
      // Walk-in harus lunas
      return;
    }

    // Validasi semua item punya harga atau set ke null
    const detail = cart.map((item) => ({
      produkId: item.produkId,
      jumlah: item.jumlah,
      harga: item.harga,
      subtotal: item.subtotal,
    }));

    const ongkos = parseFloat(parseCurrency(ongkosBongkarTimbang || "0")) || 0;

    // Backend memvalidasi total harus sama dengan sum subtotal (tanpa ongkos)
    // Jadi kita kirim total = totalPembelian (sum subtotal), bukan totalAkhir
    const payload: CreatePembelianDto & {
      isCashless: boolean;
      rekeningId?: string | null;
      ongkosBongkarTimbang?: number;
      jumlahBayar?: number;
    } = {
      pemasokId: pemasokId === "__walkin__" || !pemasokId ? null : pemasokId,
      total: totalPembelian, // Kirim total pembelian (sum subtotal), bukan totalAkhir
      catatan: catatan || "", // Ubah null menjadi empty string untuk menghindari error backend
      createdAt: createdAt && /^\d{4}-\d{2}-\d{2}$/.test(createdAt) ? createdAt : undefined,
      detail,
      isCashless,
      rekeningId: isCashless ? rekeningId || null : null,
      ongkosBongkarTimbang: ongkos > 0 ? ongkos : undefined,
      // Jumlah bayar: walk-in = lunas (undefined). Ada pemasok: kosong = 0 = hutang penuh; terisi = nilai yang dibayar.
      jumlahBayar: (() => {
        const isWalkIn =
          !pemasokId || pemasokId === "__walkin__" || pemasokId === "__none__";
        if (isWalkIn) {
          return undefined; // Backend set ke totalPembayaran = lunas
        }
        if (jumlahBayar && jumlahBayar.trim() !== "") {
          const num = parseFloat(parseCurrency(jumlahBayar)) || 0;
          return Math.min(Math.max(0, num), totalAkhir);
        }
        return 0; // Kosong = tidak bayar = seluruhnya jadi hutang
      })(),
    };

    pendingPayloadRef.current = payload;
    openConfirmPassword({
      title: "Konfirmasi password",
      description:
        "Masukkan password Anda untuk melanjutkan checkout pembelian.",
      onConfirm: handleConfirmAfterPassword,
    });
  };

  const handleConfirmAfterPassword = React.useCallback(async () => {
    const payload = pendingPayloadRef.current;
    if (!payload) return;
    try {
      await onSubmit(payload);
      handleClearCart();
      pendingPayloadRef.current = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem(getStorageKey("cart"));
        localStorage.removeItem(getStorageKey("checkout"));
      }
    } catch (error: any) {
      console.error("Error submitting pembelian:", error);
    }
  }, [onSubmit, handleClearCart]);

  const isEditMode = !!editingItemId;

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 min-h-0 flex-1 lg:h-[calc(100vh-12rem)] overflow-y-auto lg:overflow-hidden">
        {/* Left Panel - Cart (stack first on mobile/tablet; 2:1 on desktop) */}
        <div className="flex flex-col border rounded-lg overflow-hidden min-w-0 flex-none lg:flex-[2] min-h-[200px] lg:min-h-0">
          <CardHeader className="bg-muted/50 p-2 sm:p-3 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Keranjang</span>
              </CardTitle>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={handleOpenProductListDialog}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Produk
                </Button>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCart}
                    className="text-destructive h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <Separator />
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground py-6 sm:py-8 px-3 sm:px-4 text-sm">
                Keranjang kosong
                <br />
                <span className="text-xs sm:text-sm">
                  Pilih produk untuk menambah ke keranjang
                </span>
              </div>
            ) : (
              <table className="w-full min-w-[300px] md:table-fixed border-collapse text-xs sm:text-sm">
                <colgroup>
                  <col />
                  <col style={{ width: "6rem" }} />
                  <col style={{ width: "6rem" }} />
                  <col style={{ width: "7rem" }} />
                  <col style={{ width: "4.5rem" }} />
                </colgroup>
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-8 sm:h-9 px-1.5 sm:px-2 py-1 sm:py-1.5 text-left font-medium whitespace-nowrap">
                      Produk
                    </th>
                    <th className="h-8 sm:h-9 px-1.5 sm:px-2 py-1 sm:py-1.5 text-left font-medium whitespace-nowrap">
                      Qty
                    </th>
                    <th className="h-8 sm:h-9 px-1.5 sm:px-2 py-1 sm:py-1.5 text-left font-medium whitespace-nowrap">
                      Harga
                    </th>
                    <th className="h-8 sm:h-9 px-1.5 sm:px-2 py-1 sm:py-1.5 text-right font-medium whitespace-nowrap">
                      Subtotal
                    </th>
                    <th className="h-8 sm:h-9 px-1 sm:px-2 py-1 sm:py-1.5 w-9 sm:w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/30">
                      <td className="px-1.5 sm:px-2 py-1 sm:py-1.5 min-w-0">
                        <div className="font-medium text-xs sm:text-sm truncate">
                          {item.produk.nama_produk}
                        </div>
                      </td>
                      <td className="px-1.5 sm:px-2 py-1 sm:py-1.5 min-w-0 overflow-hidden whitespace-nowrap">
                        <span className="tabular-nums">
                          {formatJumlahKg(item.jumlah)}
                        </span>
                        <span className="text-muted-foreground text-[10px] sm:text-xs ml-0.5 sm:ml-1">
                          KG
                        </span>
                      </td>
                      <td className="px-1.5 sm:px-2 py-1 sm:py-1.5 min-w-0 overflow-hidden">
                        <div
                          className="truncate text-left text-xs sm:text-sm tabular-nums"
                          title={item.harga ? formatCurrency(item.harga) : ""}
                        >
                          {item.harga ? formatCurrency(item.harga) : "-"}
                        </div>
                      </td>
                      <td className="px-1.5 sm:px-2 py-1 sm:py-1.5 min-w-0 overflow-hidden">
                        <div
                          className="truncate text-right text-xs sm:text-sm font-medium tabular-nums"
                          title={formatCurrency(item.subtotal)}
                        >
                          {formatCurrency(item.subtotal)}
                        </div>
                      </td>
                      <td className="px-1 sm:px-2 py-1 sm:py-1.5 overflow-visible whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 shrink-0"
                            onClick={() => handleEditCartItem(item)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-destructive shrink-0"
                            onClick={() => handleRemoveFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t p-2 sm:p-4 bg-muted/50 space-y-0.5 sm:space-y-1 shrink-0">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totalPembelian)}</span>
              </div>
              {parseFloat(parseCurrency(ongkosBongkarTimbang || "0")) > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Ongkos Bongkar</span>
                  <span className="text-red-600">
                    -
                    {formatCurrency(
                      parseFloat(parseCurrency(ongkosBongkarTimbang || "0")),
                    )}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t">
                <span className="text-base sm:text-lg font-semibold">
                  Total
                </span>
                <span className="text-lg sm:text-xl font-bold">
                  {formatCurrency(totalAkhir)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Checkout */}
        <div className="flex flex-col border rounded-lg overflow-hidden min-w-0 flex-none lg:flex-1 lg:min-h-0 lg:shrink">
          <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Tanggal transaksi (created_at) */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Tanggal transaksi
              </label>
              <div className="flex flex-col lg:flex-row gap-2">
                <div className="w-full">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal"
                      >
                        {createdAt ? (
                          createdAt
                        ) : (
                          <span className="text-muted-foreground">
                            Pilih tanggal
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          createdAt
                            ? new Date(createdAt + "T00:00:00")
                            : undefined
                        }
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          if (!date) return;
                          const y = date.getFullYear();
                          const m = String(date.getMonth() + 1).padStart(
                            2,
                            "0",
                          );
                          const d = String(date.getDate()).padStart(2, "0");
                          setCreatedAt(`${y}-${m}-${d}`);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
              </div>
            </div>

            {/* Pemasok */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-sm font-medium">
                  Pemasok (Opsional)
                </label>
                {onQuickAddPemasok && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setQuickAddPemasokOpen(true)}
                  >
                    <Plus className="size-3.5 mr-1" />
                    Tambah pemasok
                  </Button>
                )}
              </div>
              <Select
                value={pemasokId || "__none__"}
                onValueChange={(value) =>
                  setPemasokId(value === "__none__" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih pemasok atau biarkan kosong" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    Walk-in (Tanpa Pemasok)
                  </SelectItem>
                  {pemasokOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ongkos Bongkar Timbang */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Ongkos Bongkar Timbang (Opsional)
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="0"
                  value={formatCurrency(
                    parseFloat(parseCurrency(ongkosBongkarTimbang || "0")) || 0,
                  )}
                  onChange={(e) =>
                    setOngkosBongkarTimbang(parseCurrency(e.target.value))
                  }
                  onBlur={() => {
                    const num =
                      parseFloat(parseCurrency(ongkosBongkarTimbang || "0")) ||
                      0;
                    setOngkosBongkarTimbang(num > 0 ? formatCurrency(num) : "");
                  }}
                  autoComplete="off"
                  className="pl-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                  Rp
                </span>
              </div>
            </div>

            {/* Total Akhir */}
            <div className="p-3 sm:p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <span className="text-base sm:text-lg font-semibold">
                  Total Akhir
                </span>
                <span className="text-xl sm:text-2xl font-bold tabular-nums truncate">
                  {formatCurrency(totalAkhir)}
                </span>
              </div>
            </div>

            {/* Jumlah Bayar */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Jumlah Bayar {totalAkhir > 0 && "*"}
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  {(() => {
                    const isWalkIn =
                      !pemasokId ||
                      pemasokId === "__walkin__" ||
                      pemasokId === "__none__";
                    if (isWalkIn) {
                      return "(Walk-in harus lunas)";
                    }
                    return "";
                  })()}
                </span>
              </label>
              <Input
                type="text"
                placeholder={totalAkhir > 0 ? formatCurrency(totalAkhir) : "0"}
                value={(() => {
                  const isWalkIn =
                    !pemasokId ||
                    pemasokId === "__walkin__" ||
                    pemasokId === "__none__";
                  if (isWalkIn && totalAkhir > 0)
                    return formatCurrency(totalAkhir);
                  return formatCurrency(jumlahBayar || "0");
                })()}
                onChange={(e) => {
                  const isWalkIn =
                    !pemasokId ||
                    pemasokId === "__walkin__" ||
                    pemasokId === "__none__";
                  if (isWalkIn) return;
                  const raw = parseCurrency(e.target.value);
                  setJumlahBayar(raw || "0");
                }}
                onBlur={() => {
                  const isWalkIn =
                    !pemasokId ||
                    pemasokId === "__walkin__" ||
                    pemasokId === "__none__";
                  if (isWalkIn) return;
                  const parsed =
                    parseFloat(parseCurrency(jumlahBayar || "0")) || 0;
                  const finalValue = Math.max(
                    0,
                    parsed > totalAkhir ? totalAkhir : parsed,
                  );
                  setJumlahBayar(String(finalValue));
                }}
                disabled={(() => {
                  const isWalkIn =
                    !pemasokId ||
                    pemasokId === "__walkin__" ||
                    pemasokId === "__none__";
                  return isWalkIn && totalAkhir > 0;
                })()}
                className={(() => {
                  const currentJumlahBayar =
                    parseFloat(parseCurrency(jumlahBayar || "0")) || 0;
                  if (currentJumlahBayar > totalAkhir && totalAkhir > 0)
                    return "border-destructive";
                  return "";
                })()}
              />
              {(() => {
                const currentJumlahBayar =
                  parseFloat(parseCurrency(jumlahBayar || "0")) || 0;
                if (currentJumlahBayar > totalAkhir && totalAkhir > 0) {
                  return (
                    <p className="text-sm text-destructive mt-1">
                      Jumlah bayar tidak boleh melebihi total akhir
                    </p>
                  );
                }
                if (
                  currentJumlahBayar > 0 &&
                  currentJumlahBayar < totalAkhir &&
                  pemasokId &&
                  pemasokId !== "__walkin__" &&
                  pemasokId !== "__none__"
                ) {
                  const sisaHutang = totalAkhir - currentJumlahBayar;
                  return (
                    <p className="text-sm text-muted-foreground mt-1">
                      Sisa akan menjadi hutang: {formatCurrency(sisaHutang)}
                    </p>
                  );
                }
                if (
                  currentJumlahBayar === 0 &&
                  totalAkhir > 0 &&
                  pemasokId &&
                  pemasokId !== "__walkin__" &&
                  pemasokId !== "__none__"
                ) {
                  return (
                    <p className="text-sm text-muted-foreground mt-1">
                      Tidak bayar — seluruh total akan jadi hutang:{" "}
                      {formatCurrency(totalAkhir)}
                    </p>
                  );
                }
                return null;
              })()}
            </div>

            {/* Is Cashless */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCashless"
                checked={isCashless}
                onCheckedChange={(checked) => {
                  setIsCashless(checked as boolean);
                  // Reset rekening ketika isCashless berubah
                  setRekeningId("");
                }}
              />
              <Label
                htmlFor="isCashless"
                className="text-sm font-medium cursor-pointer"
              >
                Cashless (Transfer/Bank)
              </Label>
            </div>

            {/* Rekening - selalu muncul, disabled jika tidak cashless */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Sumber Rekening {isCashless && "*"}
              </label>
              <Select
                value={rekeningId}
                onValueChange={setRekeningId}
                disabled={!isCashless}
              >
                <SelectTrigger className="w-full" disabled={!isCashless}>
                  <SelectValue placeholder="Pilih rekening" />
                </SelectTrigger>
                <SelectContent>
                  {rekeningOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Catatan */}
          </div>

          {/* Footer - Submit */}
          <div className="border-t p-3 sm:p-4 bg-muted/50 shrink-0">
            <Button
              onClick={handleSubmitCheckout}
              disabled={
                isLoading || cart.length === 0 || (isCashless && !rekeningId)
              }
              className="w-full h-10 sm:h-11 text-sm sm:text-base"
              size="lg"
            >
              {isLoading ? "Menyimpan..." : "Simpan Pembelian"}
            </Button>
          </div>
        </div>

        {/* Dialog List Produk */}
        <Dialog
          open={productListDialogOpen}
          onOpenChange={setProductListDialogOpen}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Pilih Produk</DialogTitle>
              <DialogDescription>
                Pilih produk yang ingin ditambahkan ke keranjang
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="overflow-y-auto max-h-[50dvh] sm:max-h-[400px]">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {filteredProduk.map((produk) => (
                    <div
                      key={produk.id}
                      className=" border rounded-xl cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleSelectProduct(produk)}
                    >
                      <div className="p-4">
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className="font-medium text-sm">
                            {produk.nama_produk}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredProduk.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    Tidak ada produk ditemukan
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setProductListDialogOpen(false)}
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Tambah/Edit Produk */}
        <Dialog
          open={addProductDialogOpen}
          onOpenChange={setAddProductDialogOpen}
        >
          <DialogContent className="w-[calc(100vw-2rem)] max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Produk" : "Tambah Produk ke Keranjang"}
              </DialogTitle>
              <DialogDescription asChild>
                {selectedProduk ? (
                  <span>
                    <span className="font-medium">
                      {selectedProduk.nama_produk}
                    </span>
                    {" - "}
                    <span className="text-xs text-muted-foreground">
                      {selectedProduk.satuan}
                    </span>
                  </span>
                ) : (
                  <span>Masukkan jumlah dan harga produk</span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Jumlah *
                </label>
                <JumlahKgInput
                  value={dialogJumlah}
                  onChange={setDialogJumlah}
                  satuan={"kg"}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Harga per Satuan (Opsional)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="0"
                    value={formatCurrency(
                      parseFloat(parseCurrency(dialogHarga || "0")) || 0,
                    )}
                    onChange={(e) =>
                      setDialogHarga(parseCurrency(e.target.value))
                    }
                    onBlur={() => {
                      const num =
                        parseFloat(parseCurrency(dialogHarga || "0")) || 0;
                      setDialogHarga(num > 0 ? formatCurrency(num) : "");
                    }}
                    autoComplete="off"
                    className="pl-10"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                    Rp
                  </span>
                </div>
              </div>

              {dialogJumlah && dialogHarga && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(
                        (parseJumlahID(dialogJumlah) || 0) *
                          (parseNumberID(dialogHarga) || 0),
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddProductDialogOpen(false);
                  setSelectedProduk(null);
                  setEditingItemId(null);
                }}
              >
                Batal
              </Button>
              <Button
                onClick={
                  isEditMode
                    ? handleUpdateProductFromDialog
                    : handleAddProductFromDialog
                }
              >
                {isEditMode ? "Update" : "Tambah"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick tambah pemasok */}
        {onQuickAddPemasok && (
          <Dialog
            open={quickAddPemasokOpen}
            onOpenChange={setQuickAddPemasokOpen}
          >
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Tambah Pemasok</DialogTitle>
                <DialogDescription>
                  Tambah pemasok baru untuk dipakai di pembelian ini. Juga
                  tersedia di menu Pemasok.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Nama *
                  </label>
                  <Input
                    placeholder="Nama pemasok"
                    value={quickAddNama}
                    onChange={(e) => setQuickAddNama(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Telepon (Opsional)
                  </label>
                  <Input
                    placeholder="08..."
                    value={quickAddTelepon}
                    onChange={(e) => setQuickAddTelepon(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Alamat (Opsional)
                  </label>
                  <Input
                    placeholder="Alamat"
                    value={quickAddAlamat}
                    onChange={(e) => setQuickAddAlamat(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuickAddPemasokOpen(false);
                    setQuickAddNama("");
                    setQuickAddTelepon("");
                    setQuickAddAlamat("");
                  }}
                >
                  Batal
                </Button>
                <Button
                  disabled={!quickAddNama.trim() || quickAddSubmitting}
                  onClick={async () => {
                    if (!quickAddNama.trim() || !onQuickAddPemasok) return;
                    setQuickAddSubmitting(true);
                    try {
                      const { id } = await onQuickAddPemasok({
                        nama: quickAddNama.trim(),
                        telepon: quickAddTelepon.trim() || null,
                        alamat: quickAddAlamat.trim() || null,
                      });
                      setPemasokId(id);
                      setQuickAddPemasokOpen(false);
                      setQuickAddNama("");
                      setQuickAddTelepon("");
                      setQuickAddAlamat("");
                    } finally {
                      setQuickAddSubmitting(false);
                    }
                  }}
                >
                  {quickAddSubmitting ? "Menyimpan..." : "Simpan & pilih"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}
