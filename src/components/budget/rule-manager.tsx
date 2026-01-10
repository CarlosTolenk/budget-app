"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Rule } from "@/domain/rules/rule";
import type { Category } from "@/domain/categories/category";
import { initialActionState } from "@/app/actions/action-state";
import { deleteRuleAction, updateRuleAction } from "@/app/actions/rule-actions";
import { UserBucket } from "@/domain/user-buckets/user-bucket";
import { BucketMode } from "@/domain/users/user";

interface RuleManagerProps {
  rules: Rule[];
  categories: Category[];
  userBuckets: UserBucket[];
  bucketMode: BucketMode;
}

export function RuleManager({ rules, categories, userBuckets, bucketMode }: RuleManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updateState, updateAction] = useActionState(updateRuleAction, initialActionState);
  const [deleteState, deleteAction] = useActionState(deleteRuleAction, initialActionState);

  useEffect(() => {
    if (updateState.status === "success") {
      router.refresh();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditingId(null);
    }
  }, [updateState, router]);

  useEffect(() => {
    if (deleteState.status === "success") {
      router.refresh();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditingId(null);
    }
  }, [deleteState, router]);

  const sortedRules = useMemo(
    () => [...rules].sort((a, b) => b.priority - a.priority || a.pattern.localeCompare(b.pattern)),
    [rules],
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [categories],
  );
  const availableBuckets = useMemo(
    () => userBuckets.filter((bucket) => bucket.mode === bucketMode),
    [userBuckets, bucketMode],
  );
  const selectBuckets = availableBuckets.length ? availableBuckets : userBuckets;
  const bucketMetaMap = useMemo(
    () => new Map(userBuckets.map((bucket) => [bucket.id, { name: bucket.name, color: bucket.color }])),
    [userBuckets],
  );
  const deriveBucketId = (categoryId: string): string => {
    const category = categories.find((entry) => entry.id === categoryId);
    if (category) {
      return category.userBucketId;
    }
    return selectBuckets[0]?.id ?? "";
  };

  return (
    <div className="flex h-[460px] flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Rules Manager</h2>
          <p className="text-sm text-slate-300">Define prioridades para autoetiquetar transacciones usando patrones.</p>
        </div>
        <span className="text-sm text-slate-400">{sortedRules.length} reglas</span>
      </div>
      <div className="mt-4 flex-1 overflow-y-auto pr-2">
        {sortedRules.length === 0 ? (
          <p className="text-sm text-slate-400">Aún no tienes reglas configuradas.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {sortedRules.map((rule) => {
              const categoryLabel = categoryOptions.find((option) => option.value === rule.categoryId)?.label ?? "Sin categoría";
              const isEditing = editingId === rule.id;
              if (isEditing) {
                const defaultBucket = rule.userBucketId || deriveBucketId(rule.categoryId);
                return (
                  <li key={rule.id} className="rounded-xl border border-emerald-300/30 bg-emerald-300/5 p-3">
                    <form action={updateAction} className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-end">
                      <input type="hidden" name="id" value={rule.id} />
                      <label className="flex-1 text-[11px] uppercase tracking-wide text-slate-400">
                        Pattern
                        <input
                          name="pattern"
                          defaultValue={rule.pattern}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                          required
                        />
                      </label>
                      <label className="text-[11px] uppercase tracking-wide text-slate-400">
                        Prioridad
                        <input
                          type="number"
                          name="priority"
                          defaultValue={rule.priority}
                          className="mt-1 w-24 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                        />
                      </label>
                      <label className="text-[11px] uppercase tracking-wide text-slate-400">
                        Renglón
                        <select
                          name="userBucketId"
                          defaultValue={defaultBucket}
                          className="mt-1 w-32 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                          required
                          disabled={!selectBuckets.length}
                        >
                          {selectBuckets.map((bucket) => (
                            <option key={bucket.id} value={bucket.id} className="text-slate-900">
                              {bucket.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex-1 text-[11px] uppercase tracking-wide text-slate-400">
                        Categoría
                        <select
                          name="categoryId"
                          defaultValue={rule.categoryId}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                          required
                        >
                          {categoryOptions.map((option) => (
                            <option key={option.value} value={option.value} className="text-slate-900">
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex gap-2 pt-2">
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

              return (
                <li key={rule.id} className="flex flex-col gap-3 rounded-xl border border-white/10 p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-mono text-sm text-emerald-200">/{rule.pattern}/</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Prioridad #{rule.priority}</p>
                    <p className="text-sm font-semibold text-white">{categoryLabel}</p>
                    <p className="flex items-center gap-2 text-xs text-slate-400">
                      {bucketMetaMap.get(rule.userBucketId)?.color ? (
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: bucketMetaMap.get(rule.userBucketId)?.color ?? undefined }}
                          aria-hidden
                        />
                      ) : null}
                      {bucketMetaMap.get(rule.userBucketId)?.name ?? "Sin bucket"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(rule.id)}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white"
                    >
                      Editar
                    </button>
                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={rule.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-rose-400/50 px-3 py-1 text-xs font-medium text-rose-200 transition hover:border-rose-200"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {updateState.message && (
        <p className={`mt-4 text-xs ${updateState.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{updateState.message}</p>
      )}
      {deleteState.message && (
        <p className={`mt-1 text-xs ${deleteState.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{deleteState.message}</p>
      )}
    </div>
  );
}
