"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import clsx from "clsx";
import { formatCurrency } from "@/lib/format";
import type { UserBucket } from "@/domain/user-buckets/user-bucket";

type CategoryMonthlyTotal = {
  month: string;
  total: number;
};

type CategoryData = {
  id: string;
  name: string;
  bucket?: UserBucket;
  total: number;
  monthlyTotals: CategoryMonthlyTotal[];
};

interface TopCategorySpendingProps {
  categories: CategoryData[];
}

export function TopCategorySpending({ categories }: TopCategorySpendingProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id);

  const selectedCategory = useMemo(() => {
    if (categories.length === 0) {
      return undefined;
    }
    if (!selectedCategoryId) {
      return categories[0];
    }
    return categories.find((category) => category.id === selectedCategoryId) ?? categories[0];
  }, [categories, selectedCategoryId]);

  if (categories.length === 0) {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Categorías con más gasto</h2>
            <p className="text-sm text-slate-300">Analiza dónde se concentra tu presupuesto.</p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">0 categorías</span>
        </div>
        <p className="mt-6 text-sm text-slate-400">Aún no hay gastos registrados en el periodo seleccionado.</p>
      </article>
    );
  }

  const maxCategoryTotal = Math.max(...categories.map((category) => category.total), 1);
  const monthlySeries = selectedCategory?.monthlyTotals ?? [];
  const maxMonthlyValue = Math.max(...monthlySeries.map((item) => item.total), 1);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Categorías con más gasto</h2>
          <p className="text-sm text-slate-300">Toca una categoría para ver su evolución mensual.</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
          {categories.length} {categories.length === 1 ? "categoría" : "categorías"}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
        <div className="md:w-1/2">
          <ul className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {categories.map((category) => {
              const bucketLabel = category.bucket?.name;
              const width = (category.total / maxCategoryTotal) * 100;
              const isActive = selectedCategory?.id === category.id;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={clsx(
                      "w-full rounded-2xl border border-transparent px-4 py-3 text-left transition",
                      isActive ? "border-rose-300/50 bg-white/15" : "hover:bg-white/5",
                    )}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold">{category.name}</p>
                        {bucketLabel && (
                          <span className="text-[11px] uppercase tracking-wide text-slate-400">{bucketLabel}</span>
                        )}
                      </div>
                      <p className="text-sm text-white">{formatCurrency(category.total)}</p>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-white/10">
                      <div className="h-3 rounded-full bg-rose-400/80" style={{ width: `${Math.min(width, 100)}%` }} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {selectedCategory && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 md:w-1/2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Gasto mensual</p>
                <h3 className="text-lg font-semibold text-white">{selectedCategory.name}</h3>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400">Total periodo</p>
                <p className="text-base font-semibold text-rose-200">{formatCurrency(selectedCategory.total)}</p>
              </div>
            </div>

            {monthlySeries.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No hay datos mensuales para esta categoría.</p>
            ) : (
              <div className="mt-6 flex items-end gap-4 overflow-x-auto">
                {monthlySeries.map((entry) => {
                  const label = format(parseISO(`${entry.month}-01`), "LLL yy");
                  const barHeight = maxMonthlyValue > 0 ? (entry.total / maxMonthlyValue) * 140 : 0;
                  return (
                    <div key={entry.month} className="flex flex-col items-center gap-2 text-xs text-slate-300">
                      <span className="font-semibold text-rose-200">{formatCurrency(entry.total)}</span>
                      <div
                        className="w-8 rounded-full bg-rose-300/80"
                        style={{ height: `${Math.max(barHeight, 4)}px` }}
                        aria-label={`Gasto de ${formatCurrency(entry.total)} en ${label}`}
                      />
                      <span className="font-semibold uppercase tracking-wide text-slate-400">{label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
