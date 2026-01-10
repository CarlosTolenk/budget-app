"use client";

import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/domain/categories/category";
import { initialActionState } from "@/app/actions/action-state";
import { deleteCategoryAction, updateCategoryAction } from "@/app/actions/category-actions";
import { formatCurrency } from "@/lib/format";
import { ModalConfirmButton } from "@/components/ui/modal-confirm-button";
import { UserBucket } from "@/domain/user-buckets/user-bucket";
import { BucketMode } from "@/domain/users/user";

interface CategoryManagerProps {
  categories: Category[];
  userBuckets: UserBucket[];
  bucketMode: BucketMode;
}

export function CategoryManager({ categories, userBuckets, bucketMode }: CategoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [state, formAction] = useActionState(updateCategoryAction, initialActionState);
  const [deleteState, deleteAction] = useActionState(deleteCategoryAction, initialActionState);
  const router = useRouter();
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const safeAmount = useCallback((value?: number) => (typeof value === "number" && Number.isFinite(value) ? value : 0), []);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditingId(null);
    }
  }, [state, router]);

  useEffect(() => {
    if (deleteState.status === "success") {
      router.refresh();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategoryToDelete(null);
      if (editingId && categoryToDelete && editingId === categoryToDelete.id) {
        setEditingId(null);
      }
    }
  }, [deleteState, router, editingId, categoryToDelete]);

  const sorted = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name)), [categories]);
  const availableBuckets = useMemo(
    () => userBuckets.filter((bucket) => bucket.mode === bucketMode),
    [userBuckets, bucketMode],
  );
  const selectBuckets = availableBuckets.length ? availableBuckets : userBuckets;
  const bucketMetaMap = useMemo(() => {
    return new Map(userBuckets.map((bucket) => [bucket.id, { name: bucket.name, color: bucket.color }]));
  }, [userBuckets]);

  return (
    <div className="flex h-[460px] flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Editar categorías</h2>
          <p className="text-sm text-slate-300">Actualiza el nombre, renglón o monto ideal para reequilibrar tu presupuesto.</p>
        </div>
        <span className="text-sm text-slate-400">{sorted.length} en total</span>
      </div>
      <div className="mt-4 flex-1 overflow-y-auto pr-2">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-400">Todavía no tienes categorías registradas.</p>
        ) : (
          <ul className="space-y-3 text-sm">
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
                        Renglón
                        <select
                          name="userBucketId"
                          defaultValue={category.userBucketId}
                          className="mt-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                          disabled={!selectBuckets.length}
                        >
                          {selectBuckets.map((bucket) => (
                            <option key={bucket.id} value={bucket.id} className="text-slate-900">
                              {bucket.name}
                            </option>
                          ))}
                        </select>
                        {!selectBuckets.length ? (
                          <span className="text-[10px] text-rose-300">No hay buckets disponibles en este modo.</span>
                        ) : null}
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

              const bucketMeta = bucketMetaMap.get(category.userBucketId);
              const bucketLabel = bucketMeta?.name ?? "Sin renglón";
              const bucketColor = bucketMeta?.color ?? null;

              return (
                <li key={category.id} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                      {bucketColor ? <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: bucketColor }} aria-hidden /> : null}
                      {bucketLabel}
                    </p>
                    <p className="text-xs text-slate-300">Ideal mensual {formatCurrency(safeAmount(category.idealMonthlyAmount))}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(category.id)}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(category)}
                      className="rounded-full border border-rose-300/50 px-3 py-1 text-xs font-medium text-rose-200 transition hover:border-rose-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {state.message && (
        <p className={`mt-3 text-xs ${state.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{state.message}</p>
      )}
      {deleteState.message && (
        <p className={`mt-1 text-xs ${deleteState.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{deleteState.message}</p>
      )}
      {categoryToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-sm shadow-2xl" role="dialog" aria-modal="true">
            <p className="text-base font-semibold text-white">Eliminar categoría</p>
            <p className="mt-2 text-slate-300">
              ¿Seguro que deseas eliminar <span className="font-semibold text-white">{categoryToDelete.name}</span> del renglón{" "}
              {bucketMetaMap.get(categoryToDelete.userBucketId)?.name ?? "Sin renglón"}? Esta acción no se puede deshacer.
            </p>
            {deleteState.status === "error" && deleteState.message && (
              <p className="mt-3 text-xs text-rose-300">{deleteState.message}</p>
            )}
            <form action={deleteAction} className="mt-6 flex justify-end gap-2">
              <input type="hidden" name="id" value={categoryToDelete.id} />
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
              >
                Cancelar
              </button>
              <ModalConfirmButton label="Eliminar" pendingLabel="Eliminando..." variant="danger" />
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
