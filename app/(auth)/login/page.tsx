"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRef, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginContent() {
  const login = useLogin();
  const searchParams = useSearchParams();
  const submittingRef = useRef(false);

  // Tampilkan pesan dari query parameter (jika ada)
  React.useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      const decodedMessage = decodeURIComponent(message);
      // Gunakan toast.error untuk error messages, toast.info untuk info messages
      if (decodedMessage.includes("Outlet sedang tutup") || 
          decodedMessage.includes("logout") ||
          decodedMessage.includes("tidak valid")) {
        toast.error(decodedMessage, {
          duration: 6000,
        });
      } else {
        toast.info(decodedMessage, {
          duration: 5000,
        });
      }
      // Hapus query parameter dari URL setelah ditampilkan
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as LoginForm,
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }: { value: LoginForm }) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      try {
        await login.mutateAsync(value);
      } catch (error) {
        console.error("[Login Form Error]", error);
      } finally {
        submittingRef.current = false;
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Masukkan Credentials Anda untuk masuk
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <form
            id="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="nama@example.com"
                        aria-invalid={isInvalid}
                        autoComplete="email"
                      />
                      {isInvalid && (
                        <FieldError
                          errors={
                            Array.isArray(field.state.meta.errors)
                              ? field.state.meta.errors.map((err) => ({
                                  message: typeof err === "string" ? err : String(err),
                                }))
                              : field.state.meta.errors
                              ? [{ message: String(field.state.meta.errors) }]
                              : []
                          }
                        />
                      )}
                    </Field>
                  );
                }}
              />

              <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Masukkan password"
                        aria-invalid={isInvalid}
                        autoComplete="current-password"
                      />
                      {isInvalid && (
                        <FieldError
                          errors={
                            Array.isArray(field.state.meta.errors)
                              ? field.state.meta.errors.map((err) => ({
                                  message: typeof err === "string" ? err : String(err),
                                }))
                              : field.state.meta.errors
                              ? [{ message: String(field.state.meta.errors) }]
                              : []
                          }
                        />
                      )}
                    </Field>
                  );
                }}
              />
            </FieldGroup>

            <div className="mt-6 space-y-4">
              <Button
                type="submit"
                form="login-form"
                className="w-full"
                disabled={form.state.isSubmitting || login.isPending}
              >
                {form.state.isSubmitting || login.isPending
                  ? "Masuk..."
                  : "Masuk"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:underline"
                >
                  Daftar di sini
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center p-4 text-muted-foreground">Memuat...</div>}>
      <LoginContent />
    </Suspense>
  );
}
