"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

interface AmountInputProps {
  name?: string;
  id?: string;
  defaultValue?: number | string;
  value?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  allowNegative?: boolean;
  onValueChange?: (value: string) => void;
}

function normalizeAmountInput(value: string, allowNegative: boolean): string {
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  let sign = "";
  let rest = cleaned;
  if (allowNegative && cleaned.startsWith("-")) {
    sign = "-";
    rest = cleaned.slice(1);
  }
  const parts = rest.split(".");
  const integerPart = parts[0] ?? "";
  const decimalPart = parts.slice(1).join("");
  const normalized = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  return sign + normalized;
}

function formatAmountInput(value: string): string {
  if (!value) {
    return "";
  }
  const sign = value.startsWith("-") ? "-" : "";
  const rest = sign ? value.slice(1) : value;
  const [integerPart, decimalPart] = rest.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${formattedInteger}${decimalPart !== undefined ? `.${decimalPart}` : ""}`;
}

export function AmountInput({
  name,
  id,
  defaultValue,
  value,
  required,
  placeholder,
  className,
  allowNegative = false,
  onValueChange,
}: AmountInputProps) {
  const initialRaw = useMemo(() => {
    if (defaultValue === undefined || defaultValue === null) {
      return "";
    }
    return normalizeAmountInput(String(defaultValue), allowNegative);
  }, [defaultValue, allowNegative]);
  const [internalRaw, setInternalRaw] = useState(initialRaw);
  const rawValue = value !== undefined ? normalizeAmountInput(value, allowNegative) : internalRaw;
  const displayValue = formatAmountInput(rawValue);

  useEffect(() => {
    if (value === undefined) {
      setInternalRaw(initialRaw);
    }
  }, [initialRaw, value]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextRaw = normalizeAmountInput(event.target.value, allowNegative);
    if (value === undefined) {
      setInternalRaw(nextRaw);
    }
    onValueChange?.(nextRaw);
  };

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        required={required}
      />
      {name ? <input type="hidden" name={name} value={rawValue} /> : null}
    </>
  );
}
