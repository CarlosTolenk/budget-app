"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createUserBucketAction, renameUserBucketAction } from "@/app/actions/user-bucket-actions";
import { ActionState, initialActionState } from "@/app/actions/action-state";
import { BucketMode } from "@/domain/users/user";
import { UserBucket } from "@/domain/user-buckets/user-bucket";
import { Category } from "@/domain/categories/category";
import { BucketProgress } from "@/application/dtos/dashboard";
import { formatCurrency, formatPercent } from "@/lib/format";
import { presetBucketCopy } from "@/domain/user-buckets/preset-buckets";
import { ModalConfirmButton } from "@/components/ui/modal-confirm-button";

interface UserBucketsGridProps {
  bucketMode: BucketMode;
  buckets: UserBucket[];
  categoriesByBucketId: Record<string, Category[]>;
  bucketSummaries: Record<string, BucketProgress | undefined>;
  canAddMore: boolean;
  remainingSlots: number;
}

export function UserBucketsGrid({
  bucketMode,
  buckets,
  categoriesByBucketId,
  bucketSummaries,
  canAddMore,
  remainingSlots,
}: UserBucketsGridProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [bucketToRename, setBucketToRename] = useState<UserBucket | null>(null);
  const [createState, createAction] = useActionState(createUserBucketAction, initialActionState);
  const [renameState, renameAction] = useActionState(renameUserBucketAction, initialActionState);

  useEffect(() => {
    if (createState.status === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCreateOpen(false);
    }
  }, [createState]);

  useEffect(() => {
    if (renameState.status === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBucketToRename(null);
    }
  }, [renameState]);

  const sortedBuckets = useMemo(() => {
    return [...buckets].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
  }, [buckets]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Buckets activos</h2>
          <p className="text-sm text-slate-300">
            Visualiza cada renglón y las categorías asignadas en el modo {bucketMode === "PRESET" ? "guiado" : "personalizado"}.
          </p>
        </div>
        {bucketMode === "CUSTOM" ? (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            disabled={!canAddMore}
            title={canAddMore ? "Agregar bucket" : "Límite de buckets alcanzado"}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/30 text-2xl text-white transition hover:border-white/60 disabled:cursor-not-allowed disabled:border-white/15 disabled:text-white/40"
          >
            +
          </button>
        ) : null}
      </div>
      {bucketMode === "CUSTOM" ? (
        <p className="mt-2 text-xs text-slate-400">
          {canAddMore
            ? `Puedes agregar ${remainingSlots} bucket${remainingSlots === 1 ? "" : "s"} adicionales.`
            : "Ya utilizas el máximo de 4 buckets personalizados."}
        </p>
      ) : null}
      {sortedBuckets.length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">
          Todavía no tienes buckets en este modo. Agrega al menos uno para empezar a organizar tus categorías.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedBuckets.map((bucket) => {
            const summary = bucketSummaries[bucket.id];
            const categories = categoriesByBucketId[bucket.id] ?? [];
            const targetRatio =
              summary?.targetRatio ?? (bucket.presetKey ? presetBucketCopy[bucket.presetKey].targetRatio : null);
            const bucketLabel = bucket.presetKey ? presetBucketCopy[bucket.presetKey].label : bucket.name;
            const bucketDescription = bucket.presetKey
              ? presetBucketCopy[bucket.presetKey].description
              : "Bucket personalizado";
            const planned = summary?.planned ?? categories.reduce((sum, category) => sum + (category.idealMonthlyAmount ?? 0), 0);
            const spent = summary?.spent ?? 0;
            const target = summary?.target ?? 0;
            const delta = target - spent;
            const planDelta = planned - spent;

            return (
              <article key={bucket.id} className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-slate-400">{bucketDescription}</p>
                    <h3 className="text-lg font-semibold text-white">{bucketLabel}</h3>
                  </div>
                  {bucketMode === "CUSTOM" ? (
                    <button
                      type="button"
                      onClick={() => setBucketToRename(bucket)}
                      className="text-xs font-semibold text-slate-300 underline-offset-2 hover:underline"
                    >
                      Renombrar
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 text-sm text-slate-300">
                  <p>
                    Plan ideal{" "}
                    <span className="font-semibold text-white">{formatCurrency(planned)}</span>
                  </p>
                  {target ? (
                    <p>
                      Meta mensual{" "}
                      <span className="font-semibold text-white">{formatCurrency(target)}</span>{" "}
                      {typeof targetRatio === "number" ? `(${formatPercent(targetRatio)})` : null}
                    </p>
                  ) : null}
                </div>
                <div className="mt-3 rounded-xl border border-white/5 bg-white/5 p-3 text-sm">
                  <p className="text-slate-400">Gasto real</p>
                  <p className="text-2xl font-semibold text-white">{formatCurrency(spent)}</p>
                  <p className={`text-xs ${planDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {planDelta >= 0 ? "Disponible del plan" : "Sobre el plan"} {formatCurrency(Math.abs(planDelta))}
                  </p>
                  {target ? (
                    <p className={`text-xs ${delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {delta >= 0 ? "Disponible de la meta" : "Exceso total"} {formatCurrency(Math.abs(delta))}
                    </p>
                  ) : null}
                </div>
                <div className="mt-3 flex-1">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Categorías</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {categories.length ? (
                      categories.map((category) => (
                        <li key={category.id} className="rounded-lg border border-white/5 px-3 py-2 text-slate-100">
                          <div className="flex items-center justify-between gap-3">
                            <span>{category.name}</span>
                            <span className="text-xs text-slate-300">
                              {formatCurrency(category.idealMonthlyAmount ?? 0)}
                            </span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-400">Sin categorías asignadas</li>
                    )}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isCreateOpen ? (
        <BucketModal
          title="Nuevo bucket"
          description="Asigna un nombre para crear un renglón personalizado."
          closeLabel="Cancelar"
          onClose={() => setIsCreateOpen(false)}
          action={createAction}
          state={createState}
          mode="create"
        />
      ) : null}

      {bucketToRename ? (
        <BucketModal
          title="Renombrar bucket"
          description="Actualiza el nombre para reconocer mejor este renglón."
          closeLabel="Cerrar"
          onClose={() => setBucketToRename(null)}
          action={renameAction}
          state={renameState}
          mode="rename"
          bucket={bucketToRename}
        />
      ) : null}
    </section>
  );
}

interface BucketModalProps {
  title: string;
  description: string;
  closeLabel: string;
  onClose: () => void;
  action: (payload: FormData) => void;
  state: ActionState;
  mode: "create" | "rename";
  bucket?: UserBucket | null;
}

function BucketModal({ title, description, closeLabel, onClose, action, state, mode, bucket }: BucketModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-sm shadow-2xl" role="dialog" aria-modal="true">
        <p className="text-base font-semibold text-white">{title}</p>
        <p className="mt-1 text-slate-300">{description}</p>
        <form action={action} className="mt-4 space-y-3">
          {mode === "rename" && bucket ? <input type="hidden" name="bucketId" value={bucket.id} /> : null}
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
            Nombre
            <input
              name="name"
              defaultValue={bucket?.name ?? ""}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
              placeholder="Emergencias"
              required
            />
          </label>
          {state.message ? (
            <p className={`text-xs ${state.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{state.message}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
            >
              {closeLabel}
            </button>
            <ModalConfirmButton
              label={mode === "create" ? "Crear" : "Guardar"}
              pendingLabel={mode === "create" ? "Creando..." : "Guardando..."}
              variant="default"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
