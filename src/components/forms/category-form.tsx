"use client";

import { useActionState, useMemo } from "react";
import { createCategoryAction } from "@/app/actions/category-actions";
import { initialActionState } from "@/app/actions/action-state";
import { UserBucket } from "@/domain/user-buckets/user-bucket";
import { BucketMode } from "@/domain/users/user";

interface CategoryFormProps {
  userBuckets: UserBucket[];
  bucketMode: BucketMode;
}

export function CategoryForm({ userBuckets, bucketMode }: CategoryFormProps) {
  const [state, formAction] = useActionState(createCategoryAction, initialActionState);
  const availableBuckets = useMemo(
    () => userBuckets.filter((bucket) => bucket.mode === bucketMode),
    [userBuckets, bucketMode],
  );
  const selectBuckets = availableBuckets.length ? availableBuckets : userBuckets;
  const defaultBucketId = selectBuckets[0]?.id ?? "";

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
        Renglón
        <select
          name="userBucketId"
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          defaultValue={defaultBucketId}
          disabled={!selectBuckets.length}
        >
          {selectBuckets.map((bucket) => (
            <option key={bucket.id} value={bucket.id} className="text-slate-900">
              {bucket.name}
            </option>
          ))}
        </select>
        {!selectBuckets.length ? <span className="text-[10px] text-rose-300">Crea un bucket para asignar categorías.</span> : null}
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Monto ideal mensual
        <input
          name="idealMonthlyAmount"
          type="number"
          min={0}
          step="0.01"
          placeholder="500"
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
        />
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
