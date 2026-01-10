"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import type { BucketMode } from "@/domain/users/user";

interface PlanSummaryCardProps {
  planned: number;
  spent: number;
  target: number;
  planDelta: number;
  planVsTarget: number;
  targetDelta: number;
  bucketMode?: BucketMode;
}

const SEGMENT_META = {
  spent: { label: "Gasto ejecutado", strokeClass: "text-rose-400", dotClass: "bg-rose-400", valueClass: "text-rose-200" },
  planRemaining: {
    label: "Saldo del plan",
    strokeClass: "text-emerald-300",
    dotClass: "bg-emerald-300",
    valueClass: "text-emerald-200",
  },
  unassigned: { label: "Pendiente por asignar", strokeClass: "text-sky-300", dotClass: "bg-sky-300", valueClass: "text-sky-200" },
  overspend: {
    label: "Exceso del plan",
    strokeClass: "text-orange-400",
    dotClass: "bg-orange-400",
    valueClass: "text-orange-200",
  },
} as const;

export function PlanSummaryCard({
  planned,
  spent,
  target,
  planDelta,
  planVsTarget,
  targetDelta,
  bucketMode = "PRESET",
}: PlanSummaryCardProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const planRemaining = Math.max(planDelta, 0);
  const planOver = Math.max(-planDelta, 0);
  const unassigned = Math.max(planVsTarget, 0);
  const overspend = Math.max(spent - planned, 0);
  const targetBalance = Math.max(targetDelta, 0);
  const targetShortfall = Math.max(-targetDelta, 0);
  const clampedSpent = Math.max(Math.min(spent, target), 0);
  const executionRate = planned > 0 ? Math.min((spent / planned) * 100, 999) : 0;
  const planCoverageRate = target > 0 ? Math.min((planned / target) * 100, 999) : 0;
  const baseEntries = [
    { key: "spent", value: clampedSpent, ...SEGMENT_META.spent },
    { key: "planRemaining", value: planRemaining, ...SEGMENT_META.planRemaining },
    { key: "unassigned", value: unassigned, ...SEGMENT_META.unassigned },
    { key: "overspend", value: overspend, ...SEGMENT_META.overspend },
  ];
  const segments = baseEntries.filter((segment) => segment.value > 0);

  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  const hoveredInfo = segments.find((segment) => segment.key === hoveredSegment) ?? null;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="relative h-48 w-48">
            <svg viewBox="0 0 180 180" className="h-full w-full">
              <circle cx="90" cy="90" r={radius} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="16" />
              {segments.map((segment) => {
                const length = (segment.value / total) * circumference;
                const dashArray = `${length} ${circumference - length}`;
                const dashOffset = circumference * (cumulative / total);
                cumulative += segment.value;
                const tooltip = `${segment.label}: ${formatCurrency(segment.value)}`;
                return (
                  <circle
                    key={segment.key}
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="transparent"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={dashArray}
                    strokeDashoffset={-dashOffset}
                    className={segment.strokeClass}
                    stroke="currentColor"
                    aria-label={tooltip}
                    onMouseEnter={() => setHoveredSegment(segment.key)}
                    onFocus={() => setHoveredSegment(segment.key)}
                    onMouseLeave={() => setHoveredSegment((current) => (current === segment.key ? null : current))}
                    onBlur={() => setHoveredSegment((current) => (current === segment.key ? null : current))}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-sm text-slate-300">
              <p className="text-xs uppercase tracking-wide">Avance de la meta</p>
              <p className="text-2xl font-semibold text-white">
                {target > 0 ? `${Math.min((spent / target) * 100, 999).toFixed(0)}%` : "0%"}
              </p>
            </div>
            {hoveredInfo ? (
              <div className="pointer-events-none absolute -bottom-6 left-1/2 z-10 w-max -translate-x-1/2 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-center text-xs text-white shadow-lg">
                <p className="font-semibold">{hoveredInfo.label}</p>
                <p className="text-slate-300">{formatCurrency(hoveredInfo.value)}</p>
              </div>
            ) : null}
          </div>
          <ul className="grid w-full gap-3 text-sm sm:grid-cols-2">
            {baseEntries.map((segment) => (
              <li key={segment.key} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className={`h-2 w-2 rounded-full ${segment.dotClass}`} />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{segment.label}</p>
                  <p className={`font-semibold ${segment.value > 0 ? segment.valueClass : "text-slate-500"}`}>
                    {formatCurrency(segment.value)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full space-y-3 text-sm text-slate-300 lg:max-w-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Plan registrado</p>
            <p className="text-xl font-semibold text-white">{formatCurrency(planned)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Gasto ejecutado</p>
            <p className="text-xl font-semibold text-white">{formatCurrency(spent)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {bucketMode === "CUSTOM" ? "Meta mensual" : "Meta 50/30/20"}
            </p>
            <p className="text-xl font-semibold text-white">{formatCurrency(target)}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Ejecución del plan"
              value={executionRate}
              tone={executionRate <= 100 ? "positive" : "negative"}
              format="percent"
              note={
                planned === 0
                  ? undefined
                  : executionRate <= 100
                    ? `Aún disponible ${formatCurrency(planRemaining)}`
                    : `Sobreplan ${formatCurrency(planOver)}`
              }
            />
            <Stat
              label="Plan cubierto vs meta"
              value={planCoverageRate}
              tone={planCoverageRate >= 100 ? "positive" : "info"}
              format="percent"
              note={planCoverageRate >= 100 ? "Tu plan cubre toda la meta." : `Sin asignar ${formatCurrency(unassigned)}`}
            />
            <Stat
              label="Brecha contra plan"
              value={planDelta}
              tone={planDelta >= 0 ? "positive" : "negative"}
              note={planDelta >= 0 ? "Aún tienes margen." : `Sobreplan ${formatCurrency(Math.abs(planDelta))}`}
            />
            <Stat
              label="Brecha contra meta"
              value={targetDelta}
              tone={targetDelta >= 0 ? "positive" : "negative"}
              note={
                targetDelta >= 0 ? `Restan ${formatCurrency(targetBalance)} para la meta.` : `Meta excedida ${formatCurrency(targetShortfall)}`
              }
            />
          </div>
          <p className="text-xs text-slate-400">
            El “Exceso del plan” aparece cuando el gasto ejecutado supera lo que habías planificado para este mes. Mientras siga en
            0, vas dentro del plan.
          </p>
        </div>
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  tone,
  note,
  format = "currency",
}: {
  label: string;
  value: number;
  tone: "positive" | "negative" | "info";
  note?: string;
  format?: "currency" | "percent";
}) {
  const toneClass =
    tone === "positive" ? "text-emerald-300" : tone === "negative" ? "text-rose-300" : "text-sky-300";
  const formattedValue =
    format === "currency" ? formatCurrency(value) : `${value.toFixed(0)}%`;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-lg font-semibold ${toneClass}`}>{formattedValue}</p>
      {note ? <p className="text-xs text-slate-400">{note}</p> : null}
    </div>
  );
}
