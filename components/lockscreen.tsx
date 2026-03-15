"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Lock } from "lucide-react";
import axiosInstance from "@/lib/axios";

interface LockscreenProps {
  onUnlock: () => void;
}

export function Lockscreen({ onUnlock }: LockscreenProps) {
  const { user } = useAuth();
  const [isUnlocking, setIsUnlocking] = React.useState(false);

  const form = useForm({
    defaultValues: {
      password: "",
    },
    validators: {
      onSubmit: ({ value }) => {
        if (!value.password || value.password.trim() === "") {
          return "Password wajib diisi";
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      setIsUnlocking(true);
      try {
        // Verifikasi password menggunakan API dengan axios
        const response = await axiosInstance.post("/auth/verify-password", {
          email: user?.email,
          password: value.password,
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Password salah");
        }

        // Password benar, unlock
        onUnlock();
        form.reset();
        toast.success("Lockscreen dibuka");
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Password salah";
        toast.error(errorMessage);
        form.setFieldValue("password", "");
      } finally {
        setIsUnlocking(false);
      }
    },
  });

  // Auto focus pada password input saat component mount
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Focus ke input password setelah component mount
    const timer = setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-4">
            <Lock className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Lockscreen</h1>
          <p className="text-muted-foreground">
            {user?.name ? `Masukkan password untuk ${user.name}` : "Masukkan password untuk melanjutkan"}
          </p>
        </div>

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
                  disabled={isUnlocking}
                  autoComplete="current-password"
                  autoFocus
                  className="text-center text-lg"
                />
                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          </form.Field>

          <Button
            type="submit"
            className="w-full"
            disabled={isUnlocking}
            size="lg"
          >
            {isUnlocking ? "Membuka..." : "Buka Lockscreen"}
          </Button>
        </form>
      </div>
    </div>
  );
}
