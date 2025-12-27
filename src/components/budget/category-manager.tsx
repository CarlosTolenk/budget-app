"use client";

import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import type { Category } from "@/domain/categories/category";
import { initialActionState } from "@/app/actions/action-state";
import { updateCategoryAction } from "@/app/actions/category-actions";
import { formatCurrency } from "@/lib/format";

const bucketOptions = [
  { value: "NEEDS", label: "Needs" },
  { value: "WANTS", label: "Wants" },
  { value: "SAVINGS", label: "Savings" },
] as const;

interface CategoryManagerProps {
  categories: Category[];
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [state, formAction] = useActionState(updateCategoryAction, initialActionState);
  const safeAmount = useCallback((value?: number) => (typeof value === "number" && Number.isFinite(value) ? value : 0), []);

  useEffect(() => {
    if (state.status === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditingId(null);
    }
  }, [state]);

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Editar categorías</h2>
          <p className="text-sm text-slate-300">Actualiza el nombre, bucket o monto ideal para reequilibrar tu presupuesto.</p>
        </div>
        <span className="text-sm text-slate-400">{sorted.length} en total</span>
      </div>
      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Todavía no tienes categorías registradas.</p>
      ) : (
        <ul className="mt-4 space-y-3 text-sm">
          {sorted.map((category) => {
            const isEditing = editingId === category.id;
            if (isEditing) {
              return (
                <li key={category.id} className="rounded-xl border border-emerald-300/30 bg-emerald-300/5 p-3">
                  <form action={formAction} className="flex flex-col gap-2 md:flex-row md:items-end md:gap-3">
                    <input type="hidden" name="id" value={category.id} />
                    <label className="flex-1 text-[11px] uppercase tracking-wide text-slate-400">
                      Nombre
                      <input
                        name="name"
                        defaultValue={category.name}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                        required
                      />
                    </label>
                    <label className="text-[11px] uppercase tracking-wide text-slate-400">
                      Bucket
                      <select
                        name="bucket"
                        defaultValue={category.bucket}
                        className="mt-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                      >
                        {bucketOptions.map((option) => (
                          <option key={option.value} value={option.value} className="text-slate-900">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[11px] uppercase tracking-wide text-slate-400">
                      Monto ideal
                      <input
                        name="idealMonthlyAmount"
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={safeAmount(category.idealMonthlyAmount)}
                        className="mt-1 w-32 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                      />
                    </label>
                    <div className="flex gap-2 pt-4 md:pt-0">
                      <button type="submit" className="rounded-full bg-emerald-400/90 px-3 py-2 text-xs font-semibold text-slate-900">
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </li>
              );
            }

            const bucketLabel = bucketOptions.find((option) => option.value === category.bucket)?.label ?? category.bucket;

            return (
              <li key={category.id} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{bucketLabel}</p>
                  <p className="text-xs text-slate-300">Ideal mensual {formatCurrency(safeAmount(category.idealMonthlyAmount))}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(category.id)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white"
                >
                  Editar
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {state.message && (
        <p className={`mt-3 text-xs ${state.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{state.message}</p>
      )}
    </div>
  );
}
