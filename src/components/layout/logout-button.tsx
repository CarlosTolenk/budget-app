"use client";

import { useTransition } from "react";
import { logoutAction } from "@/app/actions/logout-action";

export function LogoutButton() {
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
      className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
    >
      {isPending ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
