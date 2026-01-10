"use client";

import { formatCurrency, formatPercent } from "@/lib/format";

type KpiGridProps = {
  income: number;
  planned: number;
  spent: number;
  netResult: number;
  availableCash: number;
  savingsRate: number;
  burnRate: number;
  avgDailySpend: number;
  remainingDailyBudget: number;
  remainingDays: number;
  periodStatus: "past" | "current" | "future";
};

const KPI_META = [
  { key: "income", label: "Ingresos del mes", tone: "info", formatter: formatCurrency },
  { key: "availableCash", label: "Cash disponible", tone: "positive", formatter: formatCurrency },
  { key: "netResult", label: "Resultado neto", tone: "positive", formatter: formatCurrency },
  { key: "savingsRate", label: "Tasa de ahorro", tone: "info", formatter: (value: number) => formatPercent(value / 100) },
  { key: "burnRate", label: "Burn rate", tone: "negative", formatter: (value: number) => formatPercent(value / 100) },
  { key: "avgDailySpend", label: "Gasto diario promedio", tone: "negative", formatter: formatCurrency },
  { key: "remainingDailyBudget", label: "Presupuesto diario restante", tone: "positive", formatter: formatCurrency },
] as const;

export function KpiGrid({
  income,
  planned,
  spent,
  netResult,
  availableCash,
  savingsRate,
  burnRate,
  avgDailySpend,
  remainingDailyBudget,
  remainingDays,
  periodStatus,
}: KpiGridProps) {
  const kpiValues: Record<(typeof KPI_META)[number]["key"], number> = {
    income,
    availableCash,
    netResult,
    savingsRate,
    burnRate,
    avgDailySpend,
    remainingDailyBudget,
  };

  const toneClass = (tone: "positive" | "negative" | "info") => {
    if (tone === "positive") {
      return "text-emerald-300";
    }
    if (tone === "negative") {
      return "text-rose-300";
    }
    return "text-sky-200";
  };

  const remainingCopy =
    periodStatus === "past"
      ? "Mes finalizado"
      : periodStatus === "future"
        ? "Mes programado"
        : `${remainingDays} días restantes`;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="grid gap-3 md:grid-cols-3">
        {KPI_META.map((meta) => {
          const value = kpiValues[meta.key];
          return (
            <article key={meta.key} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">{meta.label}</p>
              <p className={`mt-2 text-xl font-semibold ${toneClass(meta.tone)}`}>{meta.formatter(value)}</p>
            </article>
          );
        })}
        <article className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Plan registrado</p>
          <p className="mt-2 text-xl font-semibold text-white">{remainingCopy}</p>
          <p className="text-xs text-slate-400">
            Plan mensual {formatCurrency(planned)} · Gastado {formatCurrency(spent)}
          </p>
        </article>
      </div>
    </section>
  );
}
