"use client";

import { Building2, Calculator, RefreshCcw, SidebarIcon, DoorClosed, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "./ui/spinner";
import { Input } from "./ui/input";
import { Field, FieldError, FieldLabel } from "./ui/field";
import { useAuth } from "@/hooks/useAuth";
import { useOutlets, useRingkasanHariIni, useCurrentOutlet, outletKeys } from "@/hooks/useOutlets";
import dayjs from "@/lib/dayjs";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import { toast } from "sonner";


const SELECTED_OUTLET_KEY = "selectedOutletId";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(
    dayjs().toDate()
  );
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ringkasanHariIni = useRingkasanHariIni();
  const [tutupTokoDialogOpen, setTutupTokoDialogOpen] = useState(false);

  // IMPORTANT (hydration-safe): jangan baca localStorage saat render awal.
  const [selectedOutlet, setSelectedOutlet] = useState<string>("");

  // Fetch outlets hanya jika user adalah OWNER
  const isOwner = user?.role === "OWNER";
  const isAdmin = user?.role === "ADMIN";
  const { data: outletsData, isLoading: isLoadingOutlets } = useOutlets(
    { limit: 1000 },
    { enabled: isOwner && !!user }
  );

  // Outlet aktif (OWNER mengikuti selectedOutletId via header X-Outlet-Id)
  const activeOutletId =
    user?.role === "OWNER" ? selectedOutlet || null : user?.outletId || null;
  const { data: currentOutletData } = useCurrentOutlet(activeOutletId, {
    enabled: !!user && (user?.role !== "OWNER" || !!selectedOutlet),
  });
  const currentOutlet = currentOutletData?.data ?? user?.outlet ?? null;
  const currentOutletId = currentOutlet?.id || user?.outletId || null;

  // Load selected outlet dari localStorage setelah mount (hindari hydration mismatch)
  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem(SELECTED_OUTLET_KEY) || "";
      if (saved) setSelectedOutlet(saved);
    } catch {
      // ignore
    }
  }, [mounted]);

  // Handler untuk saat outlet dipilih (OWNER): simpan ke localStorage lalu refresh penuh ke dashboard
  const handleOutletChange = (outletId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SELECTED_OUTLET_KEY, outletId);
    }
    setSelectedOutlet(outletId);
    // Full reload ke dashboard agar semua data (termasuk ACS) ikut outlet baru
    window.location.href = "/";
  };

  // Set default outlet jika belum ada yang dipilih dan ada data outlet
  useEffect(() => {
    if (
      isOwner &&
      outletsData?.data &&
      outletsData.data.length > 0 &&
      !selectedOutlet
    ) {
      const firstOutlet = outletsData.data[0];
      handleOutletChange(firstOutlet.id);
    }
  }, [isOwner, outletsData, selectedOutlet]);

  // Set mounted setelah client-side render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update waktu setiap detik dengan timezone GMT+8 (WIB)
  useEffect(() => {
    if (!mounted) return;
    
    const timer = setInterval(() => {
      // Gunakan dayjs dengan timezone Asia/Makassar (GMT+8)
      setCurrentTime(dayjs().toDate());
    }, 1000);

    return () => clearInterval(timer);
  }, [mounted]);


  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-full" />
        {isOwner && (outletsData?.data?.length ?? 0) > 0 && (
            <div className="relative">
              <Building2 className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none z-10" />
              <Select
                value={selectedOutlet}
                onValueChange={handleOutletChange}
                disabled={isLoadingOutlets}
              >
                <SelectTrigger className="max-w-lg h-8 pl-7">
                  <SelectValue
                    placeholder={
                      isLoadingOutlets ? "Loading..." : "Pilih Outlet"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Pilih Outlet</SelectLabel>
                    {outletsData?.data?.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id}>
                        {outlet.nama}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}
        <Separator orientation="vertical" className="mr-2 h-full" />
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={() => setCalculatorOpen(true)}
        >
          <Calculator />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-full" />
        {/* Tombol Tutup Toko = kirim ringkasan hari ini via WA (OWNER & ADMIN); sekali per hari per outlet */}
        {(isAdmin || isOwner) && (() => {
          const todayStr = dayjs().format("YYYY-MM-DD");
          const terkahir = (currentOutlet as { terkahirditutup?: string | Date | null } | null)?.terkahirditutup;
          const terakhirStr = terkahir ? dayjs(terkahir).format("YYYY-MM-DD") : null;
          const sudahTutupHariIni = terakhirStr === todayStr;
          return (
            <>
              <Button
                className="h-8 px-3"
                variant="outline"
                size="sm"
                disabled={
                  ringkasanHariIni.isPending || !currentOutletId || sudahTutupHariIni
                }
                onClick={() => setTutupTokoDialogOpen(true)}
                title={
                  sudahTutupHariIni
                    ? "Outlet sudah ditutup hari ini (sekali per hari)"
                    : "Tutup toko - verifikasi password lalu kirim ringkasan via WhatsApp"
                }
              >
                {ringkasanHariIni.isPending ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    Memuat...
                  </>
                ) : sudahTutupHariIni ? (
                  <>
                    <Lock className="mr-2 size-4" />
                    Sudah Tutup Hari Ini
                  </>
                ) : (
                  <>
                    <DoorClosed className="mr-2 size-4" />
                    Tutup Toko
                  </>
                )}
              </Button>
              <Separator orientation="vertical" className="mr-2 h-full" />
            </>
          );
        })()}

       
        <div className=" sm:ml-auto sm:w-auto flex-row flex items-center w-full gap-2">
        {mounted ? (
            <>
              <div className="font-semibold text-base">
                {dayjs(currentTime).format("HH:mm:ss")}
              </div>
              <div className="text-muted-foreground text-xs">
                {dayjs(currentTime).format("dddd, DD MMMM YYYY")}
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold text-base">--:--:--</div>
              <div className="text-muted-foreground text-xs">Loading...</div>
            </>
          )}

        
        </div>
      </div>

      {/* Calculator Modal */}
      <CalculatorModal open={calculatorOpen} onOpenChange={setCalculatorOpen} />

      {/* Dialog Tutup Toko: password + uang diambil, lalu kirim ringkasan WA + catat keuangan/pembayaran */}
      <TutupTokoDialog
        open={tutupTokoDialogOpen}
        onOpenChange={setTutupTokoDialogOpen}
        isSubmitting={ringkasanHariIni.isPending}
        onConfirm={(password, uangDiambil) => {
          ringkasanHariIni.mutate(
            {
              outletId: activeOutletId,
              password,
              uangDiambil: uangDiambil && uangDiambil > 0 ? uangDiambil : undefined,
            },
            {
              onSuccess: () => {
                setTutupTokoDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: outletKeys.all });
                router.refresh();
              },
            }
          );
        }}
      />
    </header>
  );
}

// Dialog Tutup Toko: verifikasi password + uang diambil dari kas (optional, dicatat ke Keuangan & Pembayaran)
function TutupTokoDialog({
  open,
  onOpenChange,
  isSubmitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onConfirm: (password: string, uangDiambil?: number) => void;
}) {
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      password: "",
      uangDiambil: "",
    },
    validators: {
      onSubmit: ({ value }) => {
        if (!value.password || value.password.trim() === "") {
          return "Password wajib diisi";
        }
        return undefined;
      },
    },
    onSubmit: ({ value }) => {
      const uangDiambil = value.uangDiambil ? parseFloat(value.uangDiambil) : undefined;
      onConfirm(value.password.trim(), uangDiambil && uangDiambil > 0 ? uangDiambil : undefined);
    },
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => passwordInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
           
            <div>
              <DialogTitle className="mb-2">Tutup Toko</DialogTitle>
              <DialogDescription>
                Verifikasi password lalu kirim ringkasan hari ini ke WhatsApp. Jika ada uang yang diambil dari kas, isi jumlahnya (akan dicatat ke Keuangan & Pembayaran).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="password">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  ref={passwordInputRef}
                  id={field.name}
                  type="password"
                  placeholder="Masukkan password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
                {field.state.meta.isTouched && field.state.meta.errors && (
                  <FieldError
                    errors={
                      Array.isArray(field.state.meta.errors)
                        ? field.state.meta.errors
                        : [{ message: String(field.state.meta.errors) }]
                    }
                  />
                )}
              </Field>
            )}
          </form.Field>
          <form.Field name="uangDiambil">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Uang yang Diambil dari Kas (Opsional)</FieldLabel>
                <div className="relative">
                  <Input
                    id={field.name}
                    type="text"
                    value={formatCurrency(field.state.value || "")}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      const rawValue = parseCurrency(e.target.value);
                      field.handleChange(rawValue as any);
                    }}
                    placeholder="0"
                    disabled={isSubmitting}
                    autoComplete="off"
                    className="pl-10"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                    Rp
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Jumlah uang yang diambil dari kas (untuk setor ke owner). Kosongkan jika tidak ada. Akan dicatat sebagai Keuangan dan Pembayaran.
                </p>
              </Field>
            )}
          </form.Field>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Mengirim...
                </>
              ) : (
                "Kirim Ringkasan WA"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Calculator Component
function CalculatorModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState(""); // Untuk menyimpan ekspresi lengkap
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  // Reset calculator when modal closes
  useEffect(() => {
    if (!open) {
      setDisplay("0");
      setExpression("");
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(false);
    }
  }, [open]);

  const formatNumber = (num: string | number): string => {
    const numValue = typeof num === "string" ? parseFloat(num) : num;
    if (isNaN(numValue)) return num.toString();
    // Jika ada desimal, tampilkan dengan desimal
    const numStr = typeof num === "string" ? num : num.toString();
    if (numStr.includes(".")) {
      return numValue.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 10,
      });
    }
    return numValue.toLocaleString("id-ID");
  };

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
      // Update expression dengan angka baru
      if (previousValue !== null && operation) {
        setExpression(
          `${formatNumber(previousValue)} ${getOperationSymbol(
            operation
          )} ${num}`
        );
      }
    } else {
      const newDisplay = display === "0" ? num : display + num;
      setDisplay(newDisplay);
      // Update expression jika ada operasi
      if (previousValue !== null && operation) {
        setExpression(
          `${formatNumber(previousValue)} ${getOperationSymbol(
            operation
          )} ${formatNumber(newDisplay)}`
        );
      }
    }
  };

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay("0.");
      setWaitingForNewValue(false);
      if (previousValue !== null && operation) {
        setExpression(
          `${formatNumber(previousValue)} ${getOperationSymbol(operation)} 0.`
        );
      }
    } else if (display.indexOf(".") === -1) {
      const newDisplay = display + ".";
      setDisplay(newDisplay);
      // Update expression jika ada operasi
      if (previousValue !== null && operation) {
        setExpression(
          `${formatNumber(previousValue)} ${getOperationSymbol(
            operation
          )} ${newDisplay}`
        );
      }
    }
  };

  const clear = () => {
    setDisplay("0");
    setExpression("");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
      setExpression(
        `${formatNumber(inputValue)} ${getOperationSymbol(nextOperation)}`
      );
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
      setExpression(
        `${formatNumber(newValue)} ${getOperationSymbol(nextOperation)}`
      );
    } else {
      setExpression(
        `${formatNumber(inputValue)} ${getOperationSymbol(nextOperation)}`
      );
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (
    firstValue: number,
    secondValue: number,
    operation: string
  ): number => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "*":
        return firstValue * secondValue;
      case "/":
        return firstValue / secondValue;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const inputValue = parseFloat(display);
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setExpression(
        `${formatNumber(previousValue)} ${getOperationSymbol(
          operation
        )} ${formatNumber(inputValue)} = ${formatNumber(newValue)}`
      );
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      const newDisplay = display.slice(0, -1);
      setDisplay(newDisplay);
      // Update expression jika ada operasi
      if (previousValue !== null && operation) {
        setExpression(
          `${formatNumber(previousValue)} ${getOperationSymbol(
            operation
          )} ${formatNumber(newDisplay)}`
        );
      }
    } else {
      setDisplay("0");
      if (previousValue !== null && operation) {
        setExpression(
          `${formatNumber(previousValue)} ${getOperationSymbol(operation)}`
        );
      }
    }
  };

  const getOperationSymbol = (op: string | null): string => {
    switch (op) {
      case "+":
        return "+";
      case "-":
        return "−";
      case "*":
        return "×";
      case "/":
        return "÷";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kalkulator</DialogTitle>
          <DialogDescription>
            Kalkulator sederhana untuk perhitungan cepat
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Display */}
          <div className="bg-muted rounded-lg p-4">
            {/* Expression (operasi lengkap) */}
            {expression && (
              <div className="text-sm text-muted-foreground mb-2 font-mono text-right overflow-x-auto whitespace-nowrap">
                {expression}
              </div>
            )}
            {/* Display utama */}
            <div className="text-3xl font-mono font-bold overflow-x-auto text-right min-h-12 flex items-center justify-end">
              {Number(display).toLocaleString("id-ID")}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1 */}
            <Button
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={clear}
            >
              C
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={handleBackspace}
            >
              ⌫
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={() => performOperation("/")}
            >
              ÷
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={() => performOperation("*")}
            >
              ×
            </Button>

            {/* Row 2 */}
            <Button
              variant="outline"
              className="h-14 text-lg"
              onClick={() => inputNumber("7")}
            >
              7
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg"
              onClick={() => inputNumber("8")}
            >
              8
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg"
              onClick={() => inputNumber("9")}
            >
              9
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={() => performOperation("-")}
            >
              −
            </Button>

            {/* Row 3 */}
            <Button
              variant="outline"
              className="h-14 text-lg"
              onClick={() => inputNumber("4")}
            >
              4
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg"
              onClick={() => inputNumber("5")}
            >
              5
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg"
              onClick={() => inputNumber("6")}
            >
              6
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={() => performOperation("+")}
            >
              +
            </Button>

            {/* Row 4 */}
            <Button
              variant="outline"
              className="h-14 text-lg"
              onClick={() => inputNumber("1")}
            >
              1
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg"
              onClick={() => inputNumber("2")}
            >
              2
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg"
              onClick={() => inputNumber("3")}
            >
              3
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={handleEquals}
              style={{ gridRow: "span 2" }}
            >
              =
            </Button>

            {/* Row 5 */}
            <Button
              variant="outline"
              className="h-14 text-lg col-span-2"
              onClick={() => inputNumber("0")}
            >
              0
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg"
              onClick={inputDecimal}
            >
              .
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

