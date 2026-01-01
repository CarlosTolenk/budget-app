"use client";

import { useActionState, useMemo, useState } from "react";
import { createTransactionAction } from "@/app/actions/transaction-actions";
import { initialActionState } from "@/app/actions/action-state";
import { Category } from "@/domain/categories/category";
import { bucketOptions, pickDefaultBucket, type BucketValue } from "@/components/forms/bucket-options";

interface TransactionFormProps {
  categories: Category[];
}

export function TransactionForm({ categories }: TransactionFormProps) {
  const [state, formAction] = useActionState(createTransactionAction, initialActionState);
  const today = new Date().toISOString().slice(0, 10);
  const [bucket, setBucket] = useState<BucketValue>(() => pickDefaultBucket(categories));
  const [categoryId, setCategoryId] = useState("");

  const bucketCategories = useMemo(
    () => categories.filter((category) => category.bucket === bucket),
    [categories, bucket],
  );

  const resolvedCategoryId = useMemo(() => {
    if (!bucketCategories.length) {
      return "";
    }
    if (categoryId && bucketCategories.some((category) => category.id === categoryId)) {
      return categoryId;
    }
    return bucketCategories[0]?.id ?? "";
  }, [bucketCategories, categoryId]);

  const canSubmit = bucketCategories.length > 0 && Boolean(resolvedCategoryId);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
      <h3 className="text-base font-semibold text-white">Registrar transacción manual</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Fecha
          <input
            type="date"
            name="date"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white date-input"
            defaultValue={today}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Monto
          <input
            type="number"
            step="0.01"
            name="amount"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            placeholder="120.50"
            required
          />
          <span className="text-[11px] text-slate-400">Ingresa el monto positivo, lo restaremos automáticamente.</span>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Comercio / nota
          <input
            name="merchant"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            placeholder="Restaurante"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Moneda
          <input
            name="currency"
            defaultValue="DOP"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Renglón
          <select
            name="bucket"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            value={bucket}
            onChange={(event) => setBucket(event.target.value as BucketValue)}
          >
            {bucketOptions.map((option) => (
              <option key={option.value} value={option.value} className="text-slate-900">
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Categoría
          <select
            name="categoryId"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            disabled={!bucketCategories.length}
            required={bucketCategories.length > 0}
            value={resolvedCategoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="" disabled hidden>
              Selecciona una categoría
            </option>
            {bucketCategories.map((category) => (
              <option key={category.id} value={category.id} className="text-slate-900">
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!bucketCategories.length ? (
        <p className="text-xs text-rose-300">
          Este renglón no tiene categorías asignadas. Crea una en la pantalla de Presupuesto antes de registrar gastos aquí.
        </p>
      ) : null}
      {state.message && (
        <p className={`text-xs ${state.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>
          {state.message}
        </p>
      )}
      <button
        className="w-full rounded-full bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/20"
        type="submit"
        disabled={!canSubmit}
      >
        Guardar transacción
      </button>
    </form>
  );
}
