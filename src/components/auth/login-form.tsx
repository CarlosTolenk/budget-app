"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialActionState } from "@/app/actions/action-state";
import { loginAction } from "@/app/actions/login-action";

interface LoginFormProps {
  redirectTo?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      aria-busy={pending}
    >
      {pending && (
        <svg
          className="h-4 w-4 animate-spin text-slate-900"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {pending ? "Iniciando..." : "Iniciar sesión"}
    </button>
  );
}

export function LoginForm({ redirectTo = "/" }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, initialActionState);

  return (
    <form action={formAction} className="mt-8 w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Usuario
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-white focus:border-white/60 focus:outline-none"
          />
        </label>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-white focus:border-white/60 focus:outline-none"
          />
        </label>
      </div>
      {state.status === "error" && (
        <p className="text-xs text-rose-300">
          {state.message ?? "No se pudo iniciar sesión."}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
