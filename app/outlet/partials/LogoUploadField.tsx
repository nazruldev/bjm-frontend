"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { outletService } from "@/services/outletService";
import { ImagePlus, X } from "lucide-react";
import type { FieldConfig } from "@/components/datatables/customForm";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Gagal membaca file"));
    r.readAsDataURL(file);
  });
}

export function LogoUploadField({
  field,
  fieldConfig,
  isInvalid,
}: {
  field: any;
  form: any;
  fieldConfig: FieldConfig;
  isInvalid: boolean;
}) {
  const value = field.state.value as string | null | undefined;
  const src = outletService.getOutletLogoSrc(value) || value || null;
  const inputId = `logo-${field.name}`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    if (file.size > MAX_SIZE) {
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      field.handleChange(dataUrl);
    } catch {
      // ignore
    }
    e.target.value = "";
  };

  const handleClear = () => {
    field.handleChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-20 h-20 rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden">
          {src ? (
            <img
              src={src}
              alt="Preview logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImagePlus className="size-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <Input
            id={inputId}
            type="file"
            accept={ACCEPT}
            onChange={handleFileChange}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP atau GIF. Maks. 5MB. Foto akan disimpan sebagai base64.
          </p>
          {src && (
            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
              <X className="size-3.5 mr-1" />
              Hapus logo
            </Button>
          )}
        </div>
      </div>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </div>
  );
}
