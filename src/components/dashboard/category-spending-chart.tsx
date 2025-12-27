"use client";

import { formatCurrency } from "@/lib/format";

interface CategorySpendingChartProps {
  month: string;
  data: Array<{
    id: string;
    label: string;
    amount: number;
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

  const maxAmount = Math.max(...data.map((item) => item.amount), 1);
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gasto por categoría</h2>
          <p className="text-sm text-slate-300">{month}</p>
        </div>
        <span className="text-sm text-slate-300">Total {formatCurrency(total)}</span>
      </div>
      <ul className="mt-4 space-y-4">
        {data.map((item) => {
          const width = (item.amount / maxAmount) * 100;
          const percent = total ? (item.amount / total) * 100 : 0;
          return (
            <li key={item.id}>
              <div className="flex items-center justify-between text-sm">
                <p className="font-medium">{item.label}</p>
                <div className="text-right text-xs text-slate-400">
                  <p className="text-sm font-semibold text-white">{formatCurrency(item.amount)}</p>
                  <p>{percent.toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-2 h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-rose-300/80" style={{ width: `${width}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
