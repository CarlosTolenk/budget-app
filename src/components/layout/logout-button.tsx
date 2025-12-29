"use client";

import { useTransition } from "react";
import clsx from "clsx";
import { logoutAction } from "@/app/actions/logout-action";

type LogoutButtonProps = {
  className?: string;
  fullWidth?: boolean;
};

export function LogoutButton({ className, fullWidth = false }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await logoutAction();
        });
      }}
      disabled={isPending}
      className={clsx(
        "rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-50",
        fullWidth && "w-full text-center",
        className,
      )}
    >
      {isPending ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
