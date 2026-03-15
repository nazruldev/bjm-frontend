"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { useAuth } from "@/hooks/useAuth";
import { Lock } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

export interface DialogConfirmPasswordOptions {
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  /** Dipanggil ketika dialog ditutup tanpa konfirmasi (Batal / klik luar). */
  onCancel?: () => void;
}

interface ConfirmPasswordContextValue {
  openConfirmPassword: (options: DialogConfirmPasswordOptions) => void;
}

const ConfirmPasswordContext = React.createContext<ConfirmPasswordContextValue | null>(null);

export function useConfirmPassword(): ConfirmPasswordContextValue {
  const ctx = React.useContext(ConfirmPasswordContext);
  if (!ctx) {
    throw new Error("useConfirmPassword must be used within ConfirmPasswordProvider");
  }
  return ctx;
}

interface ConfirmPasswordProviderProps {
  children: React.ReactNode;
}

export function ConfirmPasswordProvider({ children }: ConfirmPasswordProviderProps) {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("Konfirmasi password");
  const [description, setDescription] = React.useState("Masukkan password Anda untuk melanjutkan.");
  const onConfirmRef = React.useRef<(() => void | Promise<void>) | null>(null);
  const onCancelRef = React.useRef<(() => void) | null>(null);

  const [password, setPassword] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const openConfirmPassword = React.useCallback((options: DialogConfirmPasswordOptions) => {
    if (user?.role === "OWNER") {
      const fn = options.onConfirm;
      if (fn) void Promise.resolve(fn()).catch(() => {});
      return;
    }
    setTitle(options.title ?? "Konfirmasi password");
    setDescription(options.description ?? "Masukkan password Anda untuk melanjutkan.");
    onConfirmRef.current = options.onConfirm;
    onCancelRef.current = options.onCancel ?? null;
    setPassword("");
    setOpen(true);
  }, [user?.role]);

  const handleOpenChange = React.useCallback((next: boolean) => {
    if (!next) {
      const cancel = onCancelRef.current;
      onCancelRef.current = null;
      onConfirmRef.current = null;
      cancel?.();
    }
    setOpen(next);
  }, []);

  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("Password wajib diisi");
      return;
    }
    setIsVerifying(true);
    try {
      const response = await axiosInstance.post("/auth/verify-password", {
        email: user?.email,
        password: password.trim(),
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Password salah");
      }
      const fn = onConfirmRef.current;
      onConfirmRef.current = null;
      onCancelRef.current = null;
      if (fn) await fn();
      setOpen(false);
      setPassword("");
      toast.success("Berhasil");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Password salah";
      toast.error(msg);
      setPassword("");
    } finally {
      setIsVerifying(false);
    }
  };

  const value = React.useMemo<ConfirmPasswordContextValue>(
    () => ({ openConfirmPassword }),
    [openConfirmPassword]
  );

  return (
    <ConfirmPasswordContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton={true}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Field className="mt-2">
              <FieldLabel htmlFor="password-confirm">Password</FieldLabel>
              <Input
                id="password-confirm"
                ref={inputRef}
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isVerifying}
                className="mt-1"
              />
            </Field>
            <DialogFooter className="mt-6 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isVerifying}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isVerifying || !password.trim()}>
                {isVerifying ? "Memverifikasi..." : "Lanjutkan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ConfirmPasswordContext.Provider>
  );
}
