"use client";

import * as React from "react";
import { Search, Plus, Trash2, ShoppingCart, X, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JumlahKgInput } from "@/components/ui/jumlah-kg-input";
import { formatCurrency, formatJumlah, parseCurrency, parseJumlah, parseNumberID } from "@/lib/utils";
import type { Produk } from "@/services/produkService";
import type { CreatePenjualanDto } from "@/services/penjualanService";
import { usePelanggans } from "@/hooks/usePelanggans";
import { toast } from "sonner";

interface CartItem {
  id: string;
  produkId: string;
  produk: Produk;
  jumlah: number;
  harga: number;
  subtotal: number;
}

interface PenjualanPOSProps {
  produkList: Produk[];
  /** Map produkId -> jumlah stok (saldo akhir). Untuk tampil di dialog pilih produk. */
  stokByProdukId?: Record<string, number>;
  onSubmit: (data: CreatePenjualanDto) => Promise<void>;
  isLoading?: boolean;
}

export function PenjualanPOS({
  produkList,
  stokByProdukId = {},
  onSubmit,
  isLoading = false,
}: PenjualanPOSProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [productListDialogOpen, setProductListDialogOpen] = React.useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = React.useState(false);
  const [selectedProduk, setSelectedProduk] = React.useState<Produk | null>(null);
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [dialogJumlah, setDialogJumlah] = React.useState("1");
  const [dialogHarga, setDialogHarga] = React.useState("");
  const [catatan, setCatatan] = React.useState("");
  const [pelangganId, setPelangganId] = React.useState<string | null>(null);
  const [biayaKirimRaw, setBiayaKirimRaw] = React.useState("");
  const [createdAt, setCreatedAt] = React.useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  });

  const WALKIN_VALUE = "__walkin";
  const { data: pelangganData } = usePelanggans({ limit: 200 });
  const pelangganOptions = pelangganData?.data ?? [];

  const filteredProduk = React.useMemo(() => {
    if (!searchQuery) return produkList;
    const q = searchQuery.toLowerCase();
    return produkList.filter(
      (p) =>
        p.nama_produk.toLowerCase().includes(q) ||
        p.satuan.toLowerCase().includes(q)
    );
  }, [produkList, searchQuery]);

  const totalPenjualan = React.useMemo(
    () => cart.reduce((sum, item) => sum + item.subtotal, 0),
    [cart]
  );

  /** Total kuantitas produk di keranjang untuk satu produkId (exclude satu item by id jika edit) */
  const totalQtyInCartForProduk = React.useCallback(
    (produkId: string, excludeItemId?: string | null) => {
      return cart.reduce((sum, item) => {
        if (item.produkId !== produkId) return sum;
        if (excludeItemId && item.id === excludeItemId) return sum;
        return sum + item.jumlah;
      }, 0);
    },
    [cart]
  );

  /** Sisa stok yang bisa ditambah ke keranjang untuk produk ini */
  const getSisaStok = React.useCallback(
    (produkId: string, excludeItemId?: string | null) => {
      const stokTersedia = stokByProdukId[produkId] ?? 0;
      const diCart = totalQtyInCartForProduk(produkId, excludeItemId);
      return Math.max(0, stokTersedia - diCart);
    },
    [stokByProdukId, totalQtyInCartForProduk]
  );

  const biayaKirim = React.useMemo(() => {
    const v = parseCurrency(biayaKirimRaw);
    const n = parseFloat(v) || 0;
    return n > 0 ? n : 0;
  }, [biayaKirimRaw]);
  const totalAkhir = totalPenjualan + biayaKirim;

  const generateCartItemId = (produkId: string, harga: number) =>
    `${produkId}_${harga}`;

  const handleOpenProductList = () => setProductListDialogOpen(true);

  const handleSelectProduct = (produk: Produk) => {
    setSelectedProduk(produk);
    setEditingItemId(null);
    setDialogJumlah("1");
    const defaultHarga = produk.harga_jual != null ? Number(produk.harga_jual) : 0;
    setDialogHarga(defaultHarga > 0 ? formatCurrency(defaultHarga) : "");
    setProductListDialogOpen(false);
    setAddProductDialogOpen(true);
  };

  const handleAddProductFromDialog = () => {
    if (!selectedProduk) {
      setAddProductDialogOpen(false);
      return;
    }
    const jumlah = parseNumberID(dialogJumlah) || 1;
    const harga = dialogHarga ? parseFloat(parseCurrency(dialogHarga)) : 0;
    if (harga <= 0) return;

    const sisaStok = getSisaStok(selectedProduk.id);
    if (jumlah > sisaStok) {
      toast.error(
        `Stok tidak mencukupi. Sisa stok: ${formatJumlah(sisaStok)} ${selectedProduk.satuan}. Jumlah yang diminta: ${formatJumlah(jumlah)}.`
      );
      return;
    }

    const subtotal = jumlah * harga;
    const itemId = generateCartItemId(selectedProduk.id, harga);

    const existing = cart.find(
      (item) => item.produkId === selectedProduk.id && item.harga === harga
    );
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                jumlah: item.jumlah + jumlah,
                subtotal: (item.jumlah + jumlah) * harga,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: itemId,
          produkId: selectedProduk.id,
          produk: selectedProduk,
          jumlah,
          harga,
          subtotal,
        },
      ]);
    }
    setAddProductDialogOpen(false);
    setSelectedProduk(null);
    setEditingItemId(null);
  };

  const handleEditCartItem = (item: CartItem) => {
    setSelectedProduk(item.produk);
    setEditingItemId(item.id);
    setDialogJumlah(item.jumlah.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 3 }));
    setDialogHarga(formatCurrency(item.harga));
    setAddProductDialogOpen(true);
  };

  const handleUpdateProductFromDialog = () => {
    if (!selectedProduk || !editingItemId) {
      setAddProductDialogOpen(false);
      return;
    }
    const jumlah = parseNumberID(dialogJumlah) || 1;
    const harga = dialogHarga ? parseFloat(parseCurrency(dialogHarga)) : 0;
    if (harga <= 0) return;

    const sisaStok = getSisaStok(selectedProduk.id, editingItemId);
    if (jumlah > sisaStok) {
      toast.error(
        `Stok tidak mencukupi. Sisa stok: ${formatJumlah(sisaStok)} ${selectedProduk.satuan}. Jumlah yang diminta: ${formatJumlah(jumlah)}.`
      );
      return;
    }

    const subtotal = jumlah * harga;
    const newItemId = generateCartItemId(selectedProduk.id, harga);
    const editingItem = cart.find((item) => item.id === editingItemId);
    if (!editingItem) {
      setAddProductDialogOpen(false);
      setSelectedProduk(null);
      setEditingItemId(null);
      return;
    }
    if (editingItem.id === newItemId) {
      setCart(
        cart.map((item) =>
          item.id === editingItemId ? { ...item, jumlah, subtotal } : item
        )
      );
    } else {
      const newCart = cart.filter((item) => item.id !== editingItemId);
      setCart([
        ...newCart,
        {
          id: newItemId,
          produkId: selectedProduk.id,
          produk: selectedProduk,
          jumlah,
          harga,
          subtotal,
        },
      ]);
    }
    setAddProductDialogOpen(false);
    setSelectedProduk(null);
    setEditingItemId(null);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
    setCatatan("");
    setPelangganId(null);
    setBiayaKirimRaw("");
    const t = new Date();
    setCreatedAt(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`);
  };

  const handleSubmitCheckout = async () => {
    if (cart.length === 0) return;
    const detail = cart.map((item) => ({
      produkId: item.produkId,
      jumlah: item.jumlah,
      harga: item.harga,
      subtotal: item.subtotal,
    }));
    const payload: CreatePenjualanDto = {
      total: totalAkhir,
      detail,
      catatan: catatan.trim() || undefined,
      pelangganId: pelangganId && pelangganId !== WALKIN_VALUE ? pelangganId : null,
      biayaKirim: biayaKirim > 0 ? biayaKirim : null,
      createdAt: createdAt || undefined,
    };
    try {
      await onSubmit(payload);
      handleClearCart();
    } catch (e) {
      console.error("Error submitting penjualan:", e);
    }
  };

  const isEditMode = !!editingItemId;

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Left Panel - Cart (2:1 ratio) */}
      <div className="flex-[2] flex flex-col border rounded-lg overflow-hidden min-w-0">
        <CardHeader className="bg-muted/50 p-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleOpenProductList}>
                <Plus className="h-4 w-4 mr-2" />
                Produk
              </Button>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCart}
                  className="text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <Separator />
        {/* Table - scroll vertikal saja, tanpa sticky; kolom sejajar */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 px-4">
              Keranjang kosong
              <br />
              <span className="text-sm">Pilih produk untuk menambah ke keranjang</span>
            </div>
          ) : (
            <table className="w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col />
                <col style={{ width: "6rem" }} />
                <col style={{ width: "6rem" }} />
                <col style={{ width: "7rem" }} />
                <col style={{ width: "4.5rem" }} />
              </colgroup>
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-9 px-2 py-1.5 text-left font-medium">Produk</th>
                  <th className="h-9 px-2 py-1.5 text-left font-medium">Kuantitas</th>
                  <th className="h-9 px-2 py-1.5 text-left font-medium">Harga</th>
                  <th className="h-9 px-2 py-1.5 text-right font-medium">Subtotal</th>
                  <th className="h-9 px-2 py-1.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/30">
                    <td className="px-2 py-1.5 min-w-0">
                      <div className="font-medium text-sm truncate">{item.produk.nama_produk}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Sisa stok: {formatJumlah(getSisaStok(item.produkId, item.id)) || "0"} {item.produk.satuan}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 min-w-0 overflow-hidden">
                      <span className="text-sm tabular-nums">{formatJumlah(item.jumlah)}</span>
                      <span className="text-muted-foreground text-xs ml-1">{item.produk.satuan}</span>
                    </td>
                    <td className="px-2 py-1.5 min-w-0 overflow-hidden">
                      <div className="truncate text-left text-sm tabular-nums" title={formatCurrency(item.harga)}>
                        {formatCurrency(item.harga)}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 min-w-0 overflow-hidden">
                      <div className="truncate text-right text-sm font-medium tabular-nums" title={formatCurrency(item.subtotal)}>
                        {formatCurrency(item.subtotal)}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 overflow-visible">
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0"
                          onClick={() => handleEditCartItem(item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive shrink-0"
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

        {/* Footer - Fixed */}
        {cart.length > 0 && (
          <div className="border-t p-4 bg-muted/50 space-y-1 shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totalPenjualan)}</span>
            </div>
            {biayaKirim > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Biaya kirim</span>
                <span>{formatCurrency(biayaKirim)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-xl font-bold">{formatCurrency(totalAkhir)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Checkout (1:1 ratio) */}
      <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tanggal transaksi (created_at)</label>
            <Input
              type="date"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Pelanggan (Opsional)</label>
            <Select
              value={pelangganId ?? WALKIN_VALUE}
              onValueChange={(v) => setPelangganId(v === WALKIN_VALUE ? null : v)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Walk-in"  />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WALKIN_VALUE}>Walk-in</SelectItem>
                {pelangganOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama}
                    {p.telepon ? ` · ${p.telepon}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Biaya Kirim (Opsional)</label>
            <Input
              type="text"
              placeholder="0"
              value={biayaKirimRaw ? formatCurrency(parseFloat(parseCurrency(biayaKirimRaw)) || 0) : ""}
              onChange={(e) => setBiayaKirimRaw(parseCurrency(e.target.value))}
              onBlur={() => {
                const n = parseFloat(parseCurrency(biayaKirimRaw)) || 0;
                setBiayaKirimRaw(n > 0 ? formatCurrency(n) : "");
              }}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Catatan (Opsional)</label>
            <Textarea
              placeholder="Catatan penjualan..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>
          {/* Total */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(totalPenjualan)}</span>
            </div>
            {biayaKirim > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                <span>Biaya kirim</span>
                <span>{formatCurrency(biayaKirim)}</span>
              </div>
            )}
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">{formatCurrency(totalAkhir)}</span>
            </div>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0 || isLoading}
            onClick={handleSubmitCheckout}
          >
            {isLoading ? "Menyimpan..." : "Simpan Penjualan"}
          </Button>
        </div>
      </div>

      <Dialog open={productListDialogOpen} onOpenChange={setProductListDialogOpen}>
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

            <div className="overflow-y-auto max-h-[400px]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredProduk.map((produk) => (
                  <div
                    key={produk.id}
                    className="border rounded-xl cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectProduct(produk)}
                  >
                    <div className="p-4">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="font-medium text-sm">{produk.nama_produk}</div>
                       
                        <div className="text-xs text-muted-foreground">
                          Sisa stok: {typeof stokByProdukId[produk.id] === "number"
                            ? (formatJumlah(getSisaStok(produk.id)) || "0")
                            : "0"}{" "}
                          <Badge variant="secondary" className="text-xs">
                            {produk.satuan}
                          </Badge>
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

      <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Item" : "Tambah ke Keranjang"}
            </DialogTitle>
            <DialogDescription asChild>
              {selectedProduk ? (
                <span>
                  <span className="font-medium">{selectedProduk.nama_produk}</span>
                  {" - "}
                  <span className="text-xs text-muted-foreground">{selectedProduk.satuan}</span>
                </span>
              ) : (
                <span>Masukkan jumlah dan harga</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedProduk && (
            <div className="space-y-4 py-4">
              {(() => {
                const sisaStok = getSisaStok(
                  selectedProduk.id,
                  isEditMode ? editingItemId : null
                );
                const jumlahNum = parseNumberID(dialogJumlah) || 0;
                const melebihiStok = jumlahNum > sisaStok;
              return (
              <>
              <div>
                <label className="text-sm font-medium mb-2 block">Jumlah *</label>
                <div className="text-xs text-muted-foreground mb-1">
                  Sisa stok: {formatJumlah(sisaStok) || "0"} {selectedProduk.satuan}
                  {melebihiStok && (
                    <span className="text-destructive block mt-0.5">
                      Jumlah melebihi stok tersedia
                    </span>
                  )}
                </div>
                <JumlahKgInput
                  value={dialogJumlah}
                  onChange={setDialogJumlah}
                  satuan={selectedProduk?.satuan ?? "kg"}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Harga per Satuan *</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="0"
                    value={formatCurrency(
                      parseFloat(parseCurrency(dialogHarga || "0")) || 0
                    )}
                    onChange={(e) => setDialogHarga(parseCurrency(e.target.value))}
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
                        (parseNumberID(dialogJumlah) || 0) *
                          (parseNumberID(dialogHarga) || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
              </>
              );
            })()}
          </div>
          )}
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
              disabled={
                !!(
                  selectedProduk &&
                  (parseNumberID(dialogJumlah) || 0) >
                    getSisaStok(
                      selectedProduk.id,
                      isEditMode ? editingItemId : null
                    )
                )
              }
              onClick={isEditMode ? handleUpdateProductFromDialog : handleAddProductFromDialog}
            >
              {isEditMode ? "Update" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
