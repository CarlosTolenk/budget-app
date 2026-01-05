"use client";

import { useTransition } from "react";
import clsx from "clsx";
import { updateBucketModeAction } from "@/app/actions/user-bucket-actions";
import { BucketMode } from "@/domain/users/user";

interface BucketModeSelectorProps {
  currentMode: BucketMode;
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
    description: "Nombra hasta 4 renglones propios para controlar tus categorías sin porcentajes fijos.",
    tooltip: "Define tus propios renglones y asigna categorías libremente.",
  },
];

export function BucketModeSelector({ currentMode }: BucketModeSelectorProps) {
  const [isPending, startTransition] = useTransition();

  const changeMode = (mode: BucketMode) => {
    if (mode === currentMode) {
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
    </section>
  );
}
