"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  createUserBucketAction,
  renameUserBucketAction,
  updateBucketColorAction,
  reorderUserBucketsAction,
  deleteUserBucketAction,
} from "@/app/actions/user-bucket-actions";
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
  const [colorState, colorAction] = useActionState(updateBucketColorAction, initialActionState);
  const [bucketToColor, setBucketToColor] = useState<UserBucket | null>(null);
  const [bucketToDelete, setBucketToDelete] = useState<UserBucket | null>(null);
  const [deleteState, deleteAction] = useActionState(deleteUserBucketAction, initialActionState);
  const [isReordering, startReorderTransition] = useTransition();
  const [expandedBucketId, setExpandedBucketId] = useState<string | null>(null);

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

  useEffect(() => {
    if (colorState.status === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBucketToColor(null);
    }
  }, [colorState]);

  useEffect(() => {
    if (deleteState.status === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBucketToDelete(null);
    }
  }, [deleteState]);

  const sortedBuckets = useMemo(() => {
    return [...buckets].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
  }, [buckets]);

  const handleReorder = (bucketId: string, direction: "up" | "down") => {
    const order = sortedBuckets.map((bucket) => bucket.id);
    const index = order.indexOf(bucketId);
    if (index === -1) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) {
      return;
    }
    [order[index], order[targetIndex]] = [order[targetIndex], order[index]];
    startReorderTransition(() => {
      void reorderUserBucketsAction(order);
    });
  };

  const colorOptions = ["#e11d48", "#db2777", "#c026d3", "#7c3aed", "#2563eb", "#0ea5e9", "#14b8a6", "#10b981", "#22c55e", "#84cc16"];
  const customBuckets = sortedBuckets.filter((bucket) => bucket.mode === "CUSTOM");
  const canDeleteBuckets = customBuckets.length > 1;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Buckets activos</h2>
          <p className="text-sm text-slate-300">
            Visualiza cada renglón y las categorías asignadas en el modo {bucketMode === "PRESET" ? "guiado" : "personalizado"}.
          </p>
          {bucketMode === "CUSTOM" && isReordering ? (
            <p className="text-xs text-emerald-300">Guardando nuevo orden...</p>
          ) : null}
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
            const showPresetDetails = bucketMode === "PRESET" && Boolean(bucket.presetKey);
            const bucketLabel = showPresetDetails && bucket.presetKey ? presetBucketCopy[bucket.presetKey].label : bucket.name;
            const bucketDescription =
              showPresetDetails && bucket.presetKey ? presetBucketCopy[bucket.presetKey].description : null;
            const planned = summary?.planned ?? categories.reduce((sum, category) => sum + (category.idealMonthlyAmount ?? 0), 0);
            const spent = summary?.spent ?? 0;
            const target = summary?.target ?? 0;
            const delta = target - spent;
            const planDelta = planned - spent;
            const showTarget = bucketMode === "PRESET" && Boolean(target);

            return (
              <article key={bucket.id} className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                      {bucket.color ? (
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: bucket.color }} aria-hidden />
                      ) : null}
                      {bucketDescription ? <span>{bucketDescription}</span> : bucketMode === "CUSTOM" ? <span>Personalizado</span> : null}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{bucketLabel}</h3>
                  </div>
                  {bucketMode === "CUSTOM" ? (
                    <IconButton
                      label={expandedBucketId === bucket.id ? "Cerrar acciones" : "Mostrar acciones"}
                      icon={expandedBucketId === bucket.id ? "✕" : "⋯"}
                      onClick={() => setExpandedBucketId((prev) => (prev === bucket.id ? null : bucket.id))}
                    />
                  ) : null}
                </div>
                {bucketMode === "CUSTOM" && expandedBucketId === bucket.id ? (
                  <div className="mt-2 flex flex-wrap gap-1 text-xs text-white">
                    <IconButton
                      label="Subir"
                      icon="↑"
                      onClick={() => handleReorder(bucket.id, "up")}
                      disabled={isReordering || sortedBuckets[0].id === bucket.id}
                    />
                    <IconButton
                      label="Bajar"
                      icon="↓"
                      onClick={() => handleReorder(bucket.id, "down")}
                      disabled={isReordering || sortedBuckets[sortedBuckets.length - 1].id === bucket.id}
                    />
                    <IconButton label="Renombrar" icon="✎" onClick={() => setBucketToRename(bucket)} />
                    <IconButton label="Color" icon="🎨" onClick={() => setBucketToColor(bucket)} />
                    <IconButton label="Eliminar" icon="🗑" onClick={() => setBucketToDelete(bucket)} disabled={!canDeleteBuckets} />
                  </div>
                ) : null}
                <div className="mt-3 text-sm text-slate-300">
                  <p>
                    {bucketMode === "PRESET" ? "Plan ideal" : "Planificado"}{" "}
                    <span className="font-semibold text-white">{formatCurrency(planned)}</span>
                  </p>
                  {showTarget ? (
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
                  {showTarget ? (
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

      {bucketToColor ? (
        <ColorPickerModal
          bucket={bucketToColor}
          action={colorAction}
          state={colorState}
          onClose={() => setBucketToColor(null)}
          colorOptions={colorOptions}
        />
      ) : null}

      {bucketToDelete ? (
        <DeleteBucketModal
          bucket={bucketToDelete}
          action={deleteAction}
          state={deleteState}
          onClose={() => setBucketToDelete(null)}
          options={sortedBuckets.filter((candidate) => candidate.mode === "CUSTOM" && candidate.id !== bucketToDelete.id)}
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

function ColorPickerModal({
  bucket,
  action,
  state,
  onClose,
  colorOptions,
}: {
  bucket: UserBucket;
  action: (payload: FormData) => void;
  state: ActionState;
  onClose: () => void;
  colorOptions: string[];
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-sm shadow-2xl" role="dialog" aria-modal="true">
        <p className="text-base font-semibold text-white">Colores para {bucket.name}</p>
        <p className="mt-1 text-slate-300">Asigna un color para identificar este bucket en la interfaz.</p>
        {state.message ? (
          <p className={`mt-3 text-xs ${state.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{state.message}</p>
        ) : null}
        <form action={action} className="mt-4 space-y-4">
          <input type="hidden" name="bucketId" value={bucket.id} />
          <div className="grid grid-cols-5 gap-3">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="submit"
                name="color"
                value={color}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 transition hover:border-white/40"
                style={{ backgroundColor: color }}
                aria-label={`Seleccionar ${color}`}
              />
            ))}
            <button
              type="submit"
              name="color"
              value=""
              className="h-12 rounded-xl border border-dashed border-white/20 px-2 text-xs font-semibold text-white transition hover:border-white/40"
            >
              Sin color
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
            >
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteBucketModal({
  bucket,
  action,
  state,
  options,
  onClose,
}: {
  bucket: UserBucket;
  action: (payload: FormData) => void;
  state: ActionState;
  options: UserBucket[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-sm shadow-2xl" role="dialog" aria-modal="true">
        <p className="text-base font-semibold text-white">Eliminar {bucket.name}</p>
        <p className="mt-1 text-slate-300">
          Antes de eliminarlo necesitas mover sus categorías y reglas a otro bucket personalizado. Esta acción no se puede deshacer.
        </p>
        <form action={action} className="mt-4 space-y-4">
          <input type="hidden" name="bucketId" value={bucket.id} />
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
            Bucket destino
            <select
              name="targetBucketId"
              defaultValue={options[0]?.id}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
              required
              disabled={!options.length}
            >
              {options.map((candidate) => (
                <option key={candidate.id} value={candidate.id} className="text-slate-900">
                  {candidate.name}
                </option>
              ))}
            </select>
            {!options.length ? <span className="text-[11px] text-rose-300">Necesitas otro bucket para poder reasignar.</span> : null}
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
              Cancelar
            </button>
            <ModalConfirmButton label="Eliminar" pendingLabel="Eliminando..." variant="danger" disabled={!options.length} />
          </div>
        </form>
      </div>
    </div>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-[11px] transition hover:border-white/50 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30"
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
