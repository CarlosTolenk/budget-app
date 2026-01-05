"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createRuleAction } from "@/app/actions/rule-actions";
import { initialActionState } from "@/app/actions/action-state";
import { Category } from "@/domain/categories/category";
import { UserBucket } from "@/domain/user-buckets/user-bucket";
import { BucketMode } from "@/domain/users/user";
import { pickDefaultUserBucketId } from "@/lib/buckets/user-bucket-helpers";

interface RuleFormProps {
  categories: Category[];
  userBuckets: UserBucket[];
  bucketMode: BucketMode;
}

export function RuleForm({ categories, userBuckets, bucketMode }: RuleFormProps) {
  const [state, formAction] = useActionState(createRuleAction, initialActionState);
  const availableBuckets = useMemo(
    () => userBuckets.filter((bucket) => bucket.mode === bucketMode),
    [userBuckets, bucketMode],
  );
  const selectBuckets = availableBuckets.length ? availableBuckets : userBuckets;
  const defaultBucketId = useMemo(
    () => pickDefaultUserBucketId(selectBuckets, categories),
    [selectBuckets, categories],
  );
  const [bucketId, setBucketId] = useState(defaultBucketId);
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    setBucketId(defaultBucketId);
  }, [defaultBucketId]);

  const filteredCategories = useMemo(() => {
    if (!bucketId) {
      return categories;
    }
    const available = categories.filter((category) => category.userBucketId === bucketId);
    return available.length ? available : categories;
  }, [categories, bucketId]);
  const resolvedCategoryId = useMemo(() => {
    if (!filteredCategories.length) {
      return "";
    }
    if (categoryId && filteredCategories.some((category) => category.id === categoryId)) {
      return categoryId;
    }
    return filteredCategories[0]?.id ?? "";
  }, [filteredCategories, categoryId]);

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
        Renglón
        <select
          name="userBucketId"
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          value={bucketId}
          onChange={(event) => setBucketId(event.target.value)}
          required
          disabled={!selectBuckets.length}
        >
          {selectBuckets.map((bucket) => (
            <option key={bucket.id} value={bucket.id} className="text-slate-900">
              {bucket.name}
            </option>
          ))}
        </select>
        {!selectBuckets.length ? <span className="text-[10px] text-rose-300">Configura buckets para crear reglas.</span> : null}
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
        Categoría
        <select
          name="categoryId"
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          disabled={!filteredCategories.length}
          required={filteredCategories.length > 0}
          value={resolvedCategoryId}
          onChange={(event) => setCategoryId(event.target.value)}
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
