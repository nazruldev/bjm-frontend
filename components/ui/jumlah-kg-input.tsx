"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

export interface JumlahKgInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  /** Satuan yang ditampilkan di kanan (default: "kg") */
  satuan?: string;
}

/**
 * Input untuk penginputan jumlah (kg): hanya angka dan koma, max 3 desimal,
 * onBlur format locale id-ID.
 */
export function JumlahKgInput({
  value,
  onChange,
  satuan = "kg",
  className,
  onBlur: onBlurProp,
  ...props
}: JumlahKgInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let next = e.target.value;
    next = next.replace(/[^\d,]/g, "");
    const parts = next.split(",");
    if (parts.length > 2) next = parts[0] + "," + parts[1];
    if (parts[1] !== undefined) next = parts[0] + "," + parts[1].slice(0, 3);
    onChange(next);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!value) {
      onBlurProp?.(e);
      return;
    }
    const numeric = value.replace(",", ".");
    const num = parseFloat(numeric);
    if (isNaN(num)) {
      onChange("");
      onBlurProp?.(e);
      return;
    }
    const hasComma = value.includes(",");
    onChange(
      num.toLocaleString("id-ID", {
        minimumFractionDigits: hasComma ? 3 : 0,
        maximumFractionDigits: 3,
      })
    );
    onBlurProp?.(e);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="0"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        autoComplete="off"
        className={className}
        {...props}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
        {satuan}
      </span>
    </div>
  );
}
