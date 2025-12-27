"use client";

import { useActionState } from "react";
import { createRuleAction } from "@/app/actions/rule-actions";
import { initialActionState } from "@/app/actions/action-state";
import { Category } from "@/domain/categories/category";

interface RuleFormProps {
  categories: Category[];
}

export function RuleForm({ categories }: RuleFormProps) {
  const [state, formAction] = useActionState(createRuleAction, initialActionState);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
      <h3 className="text-base font-semibold text-white">Nueva regla</h3>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Pattern (regex o keyword)
        <input
          name="pattern"
          placeholder="supermarket"
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Prioridad
        <input
          type="number"
          name="priority"
          defaultValue={0}
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Categoría
        <select
          name="categoryId"
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          required
        >
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id} className="text-slate-900">
              {category.name}
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
        Guardar regla
      </button>
    </form>
  );
}
