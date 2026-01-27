"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Category } from "@/domain/categories/category";
import { UserBucket } from "@/domain/user-buckets/user-bucket";
import { createScheduledTransactionAction } from "@/app/actions/scheduled-transaction-actions";
import { initialActionState } from "@/app/actions/action-state";
import { formatAppDateInput } from "@/lib/dates/timezone";
import { pickDefaultUserBucketId } from "@/lib/buckets/user-bucket-helpers";
import { AmountInput } from "@/components/forms/amount-input";

export function ScheduledTransactionForm({ categories, userBuckets }: { categories: Category[]; userBuckets: UserBucket[] }) {
  const orderedBuckets = useMemo(
    () => [...userBuckets].sort((a, b) => a.sortOrder - b.sortOrder),
    [userBuckets],
  );
  const [bucketId, setBucketId] = useState(() => pickDefaultUserBucketId(orderedBuckets, categories));
  useEffect(() => {
    if (!bucketId && orderedBuckets.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBucketId(pickDefaultUserBucketId(orderedBuckets, categories));
    }
  }, [orderedBuckets, categories, bucketId]);
  const [categoryId, setCategoryId] = useState("");
  const [state, formAction] = useActionState(createScheduledTransactionAction, initialActionState);
  const filteredCategories = useMemo(
    () => categories.filter((category) => category.userBucketId === bucketId),
    [categories, bucketId],
  );
  const resolvedCategoryId = useMemo(() => {
    if (!filteredCategories.length) {
      return "";
    }
    if (categoryId && filteredCategories.some((category) => category.id === categoryId)) {
      return categoryId;
    }
    return filteredCategories[0]?.id ?? "";
  }, [categoryId, filteredCategories]);

  const canSubmit = filteredCategories.length > 0 && Boolean(resolvedCategoryId) && Boolean(bucketId);

  const today = formatAppDateInput(new Date());
  const hasBuckets = orderedBuckets.length > 0;

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
      <h3 className="text-base font-semibold text-white">Nueva transacción programada</h3>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Descripción
        <input name="name" className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white" placeholder="Pago préstamo" required />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Monto
          <AmountInput
            name="amount"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            placeholder="500"
            required
          />
          <span className="text-[11px] text-slate-400">Ingresa el monto positivo, lo descontaremos al ejecutarse.</span>
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Moneda
          <input name="currency" defaultValue="DOP" className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Comerciante / Nota
        <input name="merchant" className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white" placeholder="Banco" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Renglón
        <select
          name="userBucketId"
          value={bucketId}
          onChange={(event) => {
            setBucketId(event.target.value);
            setCategoryId("");
          }}
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          disabled={!hasBuckets}
        >
          {orderedBuckets.map((bucket) => (
            <option key={bucket.id} value={bucket.id} className="text-slate-900">
              {bucket.name}
            </option>
          ))}
        </select>
        </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Categoría
        <select
          name="categoryId"
          value={resolvedCategoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          disabled={!filteredCategories.length}
          required={filteredCategories.length > 0}
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
        >
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id} className="text-slate-900">
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Fecha inicial
          <input name="startDate" type="date" defaultValue={today} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white date-input" required />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Recurrencia
          <select name="recurrence" className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white">
            <option value="MONTHLY">Mensual</option>
          </select>
        </label>
      </div>
      {!filteredCategories.length ? (
        <p className="text-xs text-rose-300">
          Este renglón no tiene categorías configuradas. Crea una antes de programar el débito.
        </p>
      ) : null}
      {!hasBuckets ? (
        <p className="text-xs text-rose-300">
          No tienes renglones configurados. Ajusta tu presupuesto antes de crear planes programados.
        </p>
      ) : !filteredCategories.length ? (
        <p className="text-xs text-rose-300">Este renglón no tiene categorías disponibles.</p>
      ) : null}
      {state.message && (
        <p className={`text-xs ${state.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{state.message}</p>
      )}
      <button
        className="w-full rounded-full bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/20"
        type="submit"
        disabled={!canSubmit}
      >
        Guardar plan
      </button>
    </form>
  );
}
