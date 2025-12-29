"use client";

import clsx from "clsx";
import { useFormStatus } from "react-dom";

interface ModalConfirmButtonProps {
  label: string;
  pendingLabel?: string;
  variant?: "default" | "danger";
}

export function ModalConfirmButton({ label, pendingLabel = "Procesando...", variant = "danger" }: ModalConfirmButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        "rounded-full px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed",
        variant === "danger"
          ? pending
            ? "border border-rose-200/50 text-rose-100"
            : "bg-rose-500/90 text-white hover:bg-rose-500"
          : pending
            ? "border border-white/30 text-slate-200"
            : "bg-white text-slate-900 hover:bg-slate-100",
      )}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
