"use client";

import { formatCurrency } from "@/lib/format";

interface CategorySpendingChartProps {
  month: string;
  data: Array<{
    id: string;
    label: string;
    bucketLabel?: string;
    planned: number;
    actual: number;
  }>;
}

export function CategorySpendingChart({ month, data }: CategorySpendingChartProps) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Gasto por categoría</h2>
            <p className="text-sm text-slate-300">{month}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-400">Aún no hay gastos registrados este mes.</p>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map((item) => Math.max(item.actual, item.planned)), 1);
  const totalActual = data.reduce((sum, item) => sum + item.actual, 0);
  const totalPlanned = data.reduce((sum, item) => sum + item.planned, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gasto por categoría</h2>
          <p className="text-sm text-slate-300">{month}</p>
        </div>
        <div className="text-right text-sm text-slate-300">
          <p>Plan {formatCurrency(totalPlanned)}</p>
          <p>Real {formatCurrency(totalActual)}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-4">
        {data.map((item) => {
          const plannedWidth = (item.planned / maxAmount) * 100;
          const actualWidth = (item.actual / maxAmount) * 100;
          const delta = item.planned - item.actual;
          return (
            <li key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{item.label}</p>
                  {item.bucketLabel && (
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">{item.bucketLabel}</span>
                  )}
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p className="text-sm font-semibold text-white">Real {formatCurrency(item.actual)}</p>
                  <p className="text-sm text-slate-300">Plan {formatCurrency(item.planned)}</p>
                  <p className={delta >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {delta >= 0 ? "Disponible" : "Exceso"} {formatCurrency(Math.abs(delta))}
                  </p>
                </div>
              </div>
              <div className="relative mt-2 h-3 rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/20"
                  style={{ width: `${Math.min(plannedWidth, 100)}%` }}
                />
                <div
                  className="relative h-full rounded-full bg-rose-300/80"
                  style={{ width: `${Math.min(actualWidth, 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
