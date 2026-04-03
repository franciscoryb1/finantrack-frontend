"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  allowNegative?: boolean;
};

function formatDisplay(num: number | undefined): string {
  if (num === undefined || isNaN(num)) return "";
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function parseValue(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  // Period = thousands separator, comma = decimal separator (es-AR convention)
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? undefined : num;
}

export function CurrencyInput({ value, onChange, className, placeholder = "0,00", allowNegative = false, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const [rawValue, setRawValue] = useState(() => formatDisplay(value));

  useEffect(() => {
    if (!focused) {
      setRawValue(formatDisplay(value));
    }
  }, [value, focused]);

  function handleFocus() {
    setFocused(true);
    if (value !== undefined && !isNaN(value)) {
      setRawValue(value.toFixed(2).replace(".", ","));
    } else {
      setRawValue("");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = allowNegative ? e.target.value : e.target.value.replace("-", "");
    setRawValue(raw);
    onChange(parseValue(raw));
  }

  function handleBlur() {
    setFocused(false);
    const parsed = parseValue(rawValue);
    onChange(parsed);
    setRawValue(formatDisplay(parsed));
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      className={cn(className)}
      placeholder={placeholder}
      value={rawValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
