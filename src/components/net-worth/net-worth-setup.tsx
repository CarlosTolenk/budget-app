"use client";

import { useActionState } from "react";
import { createNetWorthSnapshotAction } from "@/app/actions/net-worth-actions";
import { initialActionState } from "@/app/actions/action-state";
import { formatMonthLabel } from "@/lib/format";

interface NetWorthSetupProps {
  month: string;
}

export function NetWorthSetup({ month }: NetWorthSetupProps) {
  const [state, formAction] = useActionState(createNetWorthSnapshotAction, initialActionState);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-slate-400">Patrimonio mensual</p>
        <h2 className="text-2xl font-semibold text-white">Configura {formatMonthLabel(month)}</h2>
        <p className="text-sm text-slate-300">
          Debes completar este formulario para registrar tu patrimonio del mes antes de continuar.
        </p>
      </div>

      <form className="mt-4 grid gap-3 md:grid-cols-[1fr_160px]" action={formAction}>
        <input type="hidden" name="month" value={month} />
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Moneda
          <input
            name="currency"
            placeholder="DOP"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            required
          />
        </label>
        <button
          type="submit"
          className="mt-4 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 md:mt-6"
        >
          Crear patrimonio
        </button>
      </form>

      {state.message && (
        <p className={`mt-3 text-xs ${state.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>
          {state.message}
        </p>
      )}
    </section>
  );
}
