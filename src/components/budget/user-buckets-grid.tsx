"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import {
  createUserBucketAction,
  renameUserBucketAction,
  updateBucketColorAction,
  reorderUserBucketsAction,
  deleteUserBucketAction,
} from "@/app/actions/user-bucket-actions";
import { ActionState, initialActionState } from "@/app/actions/action-state";
import { BucketMode } from "@/domain/users/user";
import { MAX_CUSTOM_BUCKETS, UserBucket } from "@/domain/user-buckets/user-bucket";
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
  const [visibleBuckets, setVisibleBuckets] = useState(buckets);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [bucketToRename, setBucketToRename] = useState<UserBucket | null>(null);
  const [createState, createAction] = useActionState(createUserBucketAction, initialActionState);
  const [renameState, renameAction] = useActionState(renameUserBucketAction, initialActionState);
  const [bucketToColor, setBucketToColor] = useState<UserBucket | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [colorFeedback, setColorFeedback] = useState<ActionState>(initialActionState);
  const [colorPendingBucketId, setColorPendingBucketId] = useState<string | null>(null);
  const [bucketToDelete, setBucketToDelete] = useState<UserBucket | null>(null);
  const [deleteState, deleteAction] = useActionState(deleteUserBucketAction, initialActionState);
  const [isReordering, setIsReordering] = useState(false);
  const [expandedBucketId, setExpandedBucketId] = useState<string | null>(null);
  const [draggedBucketId, setDraggedBucketId] = useState<string | null>(null);
  const [dragOverBucketId, setDragOverBucketId] = useState<string | null>(null);

  useEffect(() => {
    setVisibleBuckets(buckets);
  }, [buckets]);

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
    if (deleteState.status === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBucketToDelete(null);
    }
  }, [deleteState]);

  useEffect(() => {
    if (!bucketToColor) {
      return;
    }
    const updatedBucket = visibleBuckets.find((candidate) => candidate.id === bucketToColor.id);
    if (updatedBucket && updatedBucket !== bucketToColor) {
      setBucketToColor(updatedBucket);
    }
  }, [visibleBuckets, bucketToColor]);

  const sortedBuckets = useMemo(() => {
    return [...visibleBuckets].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
  }, [visibleBuckets]);

  const closeColorModal = () => {
    setBucketToColor(null);
    setColorFeedback(initialActionState);
    setColorPendingBucketId(null);
    setSelectedColor("");
  };

  const handleConfirmColor = () => {
    if (!bucketToColor) {
      return;
    }
    submitColorChange(bucketToColor, selectedColor);
  };

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
    submitReorder(order);
  };

  const colorOptions = ["#e11d48", "#db2777", "#c026d3", "#7c3aed", "#2563eb", "#0ea5e9", "#14b8a6", "#10b981", "#22c55e", "#84cc16"];
  const customBuckets = sortedBuckets.filter((bucket) => bucket.mode === "CUSTOM");
  const canDeleteBuckets = customBuckets.length > 1;
  const applyLocalOrder = (order: string[], sourceBuckets: UserBucket[]): UserBucket[] => {
    const bucketMap = new Map(sourceBuckets.map((bucket) => [bucket.id, bucket]));
    const orderedBuckets: UserBucket[] = [];
    order.forEach((id, index) => {
      const bucket = bucketMap.get(id);
      if (bucket) {
        orderedBuckets.push({ ...bucket, sortOrder: index });
        bucketMap.delete(id);
      }
    });
    bucketMap.forEach((bucket) => {
      orderedBuckets.push({ ...bucket, sortOrder: orderedBuckets.length });
    });
    return orderedBuckets;
  };

  const persistReorder = async (order: string[], rollbackState: UserBucket[]) => {
    setIsReordering(true);
    try {
      await reorderUserBucketsAction(order);
    } catch (error) {
      console.error(error);
      setVisibleBuckets(rollbackState.map((bucket) => ({ ...bucket })));
      if (typeof window !== "undefined") {
        window.alert("No se pudo guardar el nuevo orden. Intenta de nuevo.");
      }
    } finally {
      setIsReordering(false);
    }
  };

  const submitReorder = (order: string[]) => {
    if (!Array.isArray(order) || order.length < 2) {
      return;
    }
    const previousState = visibleBuckets.map((bucket) => ({ ...bucket }));
    setVisibleBuckets((current) => applyLocalOrder(order, current));
    void persistReorder(order, previousState);
  };
  const submitColorChange = (bucket: UserBucket, newColorValue: string) => {
    const previousColor = visibleBuckets.find((candidate) => candidate.id === bucket.id)?.color ?? null;
    const previousNormalized = previousColor ?? "";
    const normalizedColor = newColorValue?.trim() ?? "";
    if (normalizedColor === previousNormalized) {
      closeColorModal();
      return;
    }
    setColorPendingBucketId(bucket.id);
    setColorFeedback(initialActionState);
    setVisibleBuckets((current) =>
      current.map((candidate) => (candidate.id === bucket.id ? { ...candidate, color: normalizedColor || null } : candidate)),
    );
    void (async () => {
      try {
        const formData = new FormData();
        formData.append("bucketId", bucket.id);
        formData.append("color", normalizedColor);
        const result = await updateBucketColorAction(initialActionState, formData);
        if (result.status === "error") {
          setVisibleBuckets((current) =>
            current.map((candidate) => (candidate.id === bucket.id ? { ...candidate, color: previousColor } : candidate)),
          );
          setColorFeedback(result);
          if (typeof window !== "undefined") {
            window.alert(result.message ?? "No se pudo actualizar el color");
          }
          return;
        }
        setColorFeedback(result);
        closeColorModal();
      } catch (error) {
        console.error(error);
        setVisibleBuckets((current) =>
          current.map((candidate) => (candidate.id === bucket.id ? { ...candidate, color: previousColor } : candidate)),
        );
        const message = (error as Error).message ?? "No se pudo actualizar el color";
        setColorFeedback({ status: "error", message });
        if (typeof window !== "undefined") {
          window.alert(message);
        }
      } finally {
        setColorPendingBucketId(null);
      }
    })();
  };

  const handleDragStart = (bucketId: string, event: DragEvent<HTMLDivElement>) => {
    if (bucketMode !== "CUSTOM") {
      return;
    }
    event.dataTransfer.setData("text/plain", bucketId);
    event.dataTransfer.effectAllowed = "move";
    setDraggedBucketId(bucketId);
    setDragOverBucketId(null);
  };

  const handleDragOver = (bucketId: string, event: DragEvent<HTMLDivElement>) => {
    if (bucketMode !== "CUSTOM" || !draggedBucketId || draggedBucketId === bucketId) {
      return;
    }
    event.preventDefault();
    setDragOverBucketId(bucketId);
  };

  const handleDragLeave = (bucketId: string) => {
    if (dragOverBucketId === bucketId) {
      setDragOverBucketId(null);
    }
  };

  const handleDrop = (bucketId: string, event: DragEvent<HTMLDivElement>) => {
    if (bucketMode !== "CUSTOM" || !draggedBucketId || draggedBucketId === bucketId) {
      return;
    }
    event.preventDefault();
    const order = sortedBuckets.map((bucket) => bucket.id);
    const fromIndex = order.indexOf(draggedBucketId);
    const toIndex = order.indexOf(bucketId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedBucketId(null);
      setDragOverBucketId(null);
      return;
    }
    order.splice(fromIndex, 1);
    order.splice(toIndex, 0, draggedBucketId);
    submitReorder(order);
    setDraggedBucketId(null);
    setDragOverBucketId(null);
  };

  const handleDragEnd = () => {
    setDraggedBucketId(null);
    setDragOverBucketId(null);
  };

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
            : `Ya utilizas el máximo de ${MAX_CUSTOM_BUCKETS} buckets personalizados.`}
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
              <article
                key={bucket.id}
                className={`flex h-full flex-col rounded-2xl border ${dragOverBucketId === bucket.id ? "border-emerald-300/60" : "border-white/10"} bg-white/5 p-4`}
                draggable={bucketMode === "CUSTOM"}
                onDragStart={(event) => handleDragStart(bucket.id, event)}
                onDragOver={(event) => handleDragOver(bucket.id, event)}
                onDragLeave={() => handleDragLeave(bucket.id)}
                onDrop={(event) => handleDrop(bucket.id, event)}
                onDragEnd={handleDragEnd}
              >
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
                    <IconButton
                      label="Color"
                      icon="🎨"
                      onClick={() => {
                        setColorFeedback(initialActionState);
                        setSelectedColor(bucket.color ?? "");
                        setBucketToColor(bucket);
                      }}
                    />
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
          selectedColor={selectedColor}
          feedback={colorFeedback}
          onClose={closeColorModal}
          onSelectColor={setSelectedColor}
          onConfirm={handleConfirmColor}
          colorOptions={colorOptions}
          isPending={colorPendingBucketId === bucketToColor.id}
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
  selectedColor,
  onSelectColor,
  onConfirm,
  feedback,
  onClose,
  colorOptions,
  isPending,
}: {
  bucket: UserBucket;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  onConfirm: () => void;
  feedback: ActionState;
  onClose: () => void;
  colorOptions: string[];
  isPending: boolean;
}) {
  const normalizedSelection = selectedColor?.trim() ?? "";
  const currentColor = bucket.color ?? "";
  const hasChanges = normalizedSelection !== currentColor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-sm shadow-2xl" role="dialog" aria-modal="true">
        <p className="text-base font-semibold text-white">Colores para {bucket.name}</p>
        <p className="mt-1 text-slate-300">Selecciona un tono y confirma para aplicarlo.</p>
        {isPending ? <p className="mt-3 text-xs text-emerald-300">Guardando color...</p> : null}
        {feedback.message ? (
          <p className={`mt-1 text-xs ${feedback.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>{feedback.message}</p>
        ) : null}
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-5 gap-3">
            {colorOptions.map((color) => {
              const isSelected = normalizedSelection === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onSelectColor(color)}
                  disabled={isPending}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border ${isSelected ? "border-white/70 shadow-lg shadow-white/20" : "border-white/10"} transition hover:border-white/40 disabled:cursor-not-allowed disabled:border-white/5`}
                  style={{ backgroundColor: color }}
                  aria-label={`Seleccionar ${color}`}
                />
              );
            })}
            <button
              type="button"
              onClick={() => onSelectColor("")}
              disabled={isPending}
              className={`h-12 rounded-xl border px-2 text-xs font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:border-white/10 ${normalizedSelection === "" ? "border-white/70" : "border-dashed border-white/20"}`}
            >
              Sin color
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!hasChanges || isPending}
              className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-white/30"
            >
              Aceptar
            </button>
          </div>
        </div>
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
