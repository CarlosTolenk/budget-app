"use client";

import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { updateBucketModeAction } from "@/app/actions/user-bucket-actions";
import { BucketMode } from "@/domain/users/user";
import { PresetBucketKey, UserBucket } from "@/domain/user-buckets/user-bucket";
import { presetBucketCopy, presetBucketOrder } from "@/domain/user-buckets/preset-buckets";

interface BucketModeSelectorProps {
  currentMode: BucketMode;
  customBuckets: UserBucket[];
}

const modeOptions: Array<{
  value: BucketMode;
  title: string;
  description: string;
  tooltip: string;
}> = [
  {
    value: "PRESET",
    title: "Modo guiado 50/30/20",
    description: "Sigue el marco recomendado con metas sugeridas para necesidades, gustos y ahorros.",
    tooltip: "Calcula las metas automáticamente usando los porcentajes 50/30/20.",
  },
  {
    value: "CUSTOM",
    title: "Buckets personalizados",
    description: "Nombra hasta 6 renglones propios para controlar tus categorías sin porcentajes fijos.",
    tooltip: "Define tus propios renglones y asigna categorías libremente.",
  },
];

export function BucketModeSelector({ currentMode, customBuckets }: BucketModeSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [stagedMode, setStagedMode] = useState<BucketMode | null>(null);
  const [mapping, setMapping] = useState<Record<string, PresetBucketKey>>({});

  const hasCustomBuckets = customBuckets.length > 0;

  const defaultMapping = useMemo(() => {
    const defaults: Record<string, PresetBucketKey> = {};
    customBuckets.forEach((bucket, index) => {
      defaults[bucket.id] = presetBucketOrder[index % presetBucketOrder.length];
    });
    return defaults;
  }, [customBuckets]);

  const openMappingModal = () => {
    setMapping(defaultMapping);
    setIsMappingOpen(true);
    setStagedMode("PRESET");
  };

  const closeMappingModal = () => {
    setIsMappingOpen(false);
    setStagedMode(null);
  };

  const submitMapping = () => {
    if (stagedMode !== "PRESET") {
      return;
    }
    setIsMappingOpen(false);
    startTransition(() => {
      void updateBucketModeAction("PRESET", mapping);
    });
  };

  const changeMode = (mode: BucketMode) => {
    if (mode === currentMode) {
      return;
    }
    if (mode === "PRESET" && currentMode === "CUSTOM" && hasCustomBuckets) {
      openMappingModal();
      return;
    }
    startTransition(() => {
      void updateBucketModeAction(mode);
    });
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Modo de buckets</p>
          <h2 className="text-xl font-semibold text-white">Elige cómo quieres organizar tu presupuesto</h2>
        </div>
        {isPending ? <span className="text-xs text-slate-400">Actualizando...</span> : null}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {modeOptions.map((option) => (
          <label
            key={option.value}
            className={clsx(
              "flex cursor-pointer gap-3 rounded-2xl border px-4 py-3 transition",
              currentMode === option.value ? "border-emerald-300/60 bg-emerald-300/5" : "border-white/10 bg-white/5 hover:border-white/30",
            )}
            title={option.tooltip}
          >
            <input
              type="radio"
              name="bucketMode"
              className="sr-only"
              value={option.value}
              checked={currentMode === option.value}
              onChange={() => changeMode(option.value)}
              disabled={isPending}
            />
            <span
              className={clsx(
                "mt-1 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-semibold",
                currentMode === option.value ? "border-emerald-300 text-emerald-200" : "border-white/40 text-white/60",
              )}
              aria-hidden
            >
              {currentMode === option.value ? "●" : ""}
            </span>
            <div>
              <p className="font-semibold text-white">{option.title}</p>
              <p className="text-sm text-slate-300">{option.description}</p>
            </div>
          </label>
        ))}
      </div>
      {isMappingOpen ? (
        <PresetMappingModal
          mapping={mapping}
          customBuckets={customBuckets}
          onChange={(bucketId, target) => setMapping((prev) => ({ ...prev, [bucketId]: target }))}
          onClose={closeMappingModal}
          onConfirm={submitMapping}
          isSubmitting={isPending}
        />
      ) : null}
    </section>
  );
}

function PresetMappingModal({
  mapping,
  customBuckets,
  onChange,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  mapping: Record<string, PresetBucketKey>;
  customBuckets: UserBucket[];
  onChange: (bucketId: string, presetKey: PresetBucketKey) => void;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  const allAssigned = customBuckets.every((bucket) => Boolean(mapping[bucket.id]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-sm shadow-2xl" role="dialog" aria-modal="true">
        <p className="text-base font-semibold text-white">Volver al modo 50/30/20</p>
        <p className="mt-1 text-slate-300">
          Selecciona a cuál renglón estándar se moverán tus buckets personalizados. Conservaremos categorías, reglas y transacciones en el destino elegido.
        </p>
        <div className="mt-4 space-y-3">
          {customBuckets.map((bucket) => (
            <label key={bucket.id} className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-3 text-xs uppercase tracking-wide text-slate-400">
              {bucket.name}
              <select
                className="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white"
                value={mapping[bucket.id]}
                onChange={(event) => onChange(bucket.id, event.target.value as PresetBucketKey)}
                disabled={isSubmitting}
              >
                {presetBucketOrder.map((key) => (
                  <option key={key} value={key} className="text-slate-900">
                    {presetBucketCopy[key].label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-white/40"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!allAssigned || isSubmitting}
            className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-white/30"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
