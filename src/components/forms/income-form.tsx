"use client";

import { useActionState } from "react";
import { createIncomeAction } from "@/app/actions/income-actions";
import { initialActionState } from "@/app/actions/action-state";

interface IncomeFormProps {
  month: string;
}

export function IncomeForm({ month }: IncomeFormProps) {
  const [state, formAction] = useActionState(createIncomeAction, initialActionState);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
      <h3 className="text-lg font-semibold">Registrar ingreso</h3>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Mes
        <input
          type="month"
          name="month"
          defaultValue={month}
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Nombre
        <input name="name" placeholder="Salario" className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white" required />
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Monto
        <input
          type="number"
          step="0.01"
          name="amount"
          placeholder="5000"
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          required
        />
      </label>
      {state.message && (
        <p className={`text-xs ${state.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>
          {state.message}
        </p>
      )}
      <button className="w-full rounded-full bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-slate-900" type="submit">
        Guardar ingreso
      </button>
    </form>
  );
}
