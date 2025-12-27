"use client";

import { useActionState } from "react";
import { createCategoryAction } from "@/app/actions/category-actions";
import { initialActionState } from "@/app/actions/action-state";

const buckets = [
  { value: "NEEDS", label: "Needs" },
  { value: "WANTS", label: "Wants" },
  { value: "SAVINGS", label: "Savings" },
];

export function CategoryForm() {
  const [state, formAction] = useActionState(createCategoryAction, initialActionState);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
      <h3 className="text-base font-semibold text-white">Nueva categoría</h3>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Nombre
        <input
          name="name"
          placeholder="Supermercado"
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Bucket
        <select
          name="bucket"
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          defaultValue="NEEDS"
        >
          {buckets.map((bucket) => (
            <option key={bucket.value} value={bucket.value} className="text-slate-900">
              {bucket.label}
            </option>
          ))}
        </select>
      </label>
      {state.message && (
        <p className={`text-xs ${state.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>
          {state.message}
        </p>
      )}
      <button className="w-full rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900" type="submit">
        Guardar categoría
      </button>
    </form>
  );
}
