"use client";

import { formatCurrency } from "@/lib/format";

interface PlanSummaryCardProps {
  planned: number;
  spent: number;
  target: number;
  planDelta: number;
  planVsTarget: number;
  targetDelta: number;
}

const SEGMENT_META = {
  spent: { label: "Gasto real", strokeClass: "text-rose-400", dotClass: "bg-rose-400", valueClass: "text-rose-200" },
  planRemaining: {
    label: "Disponible del plan",
    strokeClass: "text-emerald-300",
    dotClass: "bg-emerald-300",
    valueClass: "text-emerald-200",
  },
  unassigned: { label: "Meta por asignar", strokeClass: "text-sky-300", dotClass: "bg-sky-300", valueClass: "text-sky-200" },
  overspend: {
    label: "Exceso sobre el plan",
    strokeClass: "text-orange-400",
    dotClass: "bg-orange-400",
    valueClass: "text-orange-200",
  },
} as const;

export function PlanSummaryCard({ planned, spent, target, planDelta, planVsTarget, targetDelta }: PlanSummaryCardProps) {
  const planRemaining = Math.max(planDelta, 0);
  const unassigned = Math.max(planVsTarget, 0);
  const overspend = Math.max(spent - planned, 0);
  const clampedSpent = Math.max(Math.min(spent, target), 0);
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
                />
              );
            })}
          </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-sm text-slate-300">
              <p className="text-xs uppercase tracking-wide">Meta usada</p>
              <p className="text-2xl font-semibold text-white">
                {target > 0 ? `${Math.min((spent / target) * 100, 999).toFixed(0)}%` : "0%"}
              </p>
              <p className="text-xs text-slate-400">{formatCurrency(spent)}</p>
            </div>
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
            <p className="text-xs uppercase tracking-wide text-slate-400">Plan total</p>
            <p className="text-xl font-semibold text-white">{formatCurrency(planned)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Gasto real</p>
            <p className="text-xl font-semibold text-white">{formatCurrency(spent)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Meta combinada</p>
            <p className="text-xl font-semibold text-white">{formatCurrency(target)}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Disponible del plan" value={planDelta} tone="positive" />
            <Stat label="Meta por asignar" value={planVsTarget} tone="info" />
            <Stat label="Disponible de la meta" value={targetDelta} tone="positive" />
            <Stat label="Exceso sobre el plan" value={overspend} tone="negative" />
          </div>
          <p className="text-xs text-slate-400">
            El “Exceso sobre el plan” aparece cuando el gasto real supera lo que habías planificado para este mes. Mientras siga en
            0, vas dentro del plan.
          </p>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "positive" | "negative" | "info" }) {
  const toneClass =
    tone === "positive" ? "text-emerald-300" : tone === "negative" ? "text-rose-300" : "text-sky-300";
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-lg font-semibold ${toneClass}`}>{formatCurrency(Math.abs(value))}</p>
    </div>
  );
}
