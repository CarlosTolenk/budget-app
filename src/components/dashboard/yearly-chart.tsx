import { format, parseISO } from "date-fns";
import { MonthlyOverview } from "@/application/use-cases/get-yearly-overview";
import { formatCurrency } from "@/lib/format";

interface YearlyChartProps {
  data: MonthlyOverview[];
}

export function YearlyChart({ data }: YearlyChartProps) {
  const filtered = data.filter((month) => month.income > 0 || month.expenses > 0);
  const chartData = (filtered.length ? filtered : data).slice(-6);
  const maxValue = Math.max(...chartData.map((item) => Math.max(item.income, item.expenses, 0)), 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Últimos 6 meses</p>
          <h2 className="text-2xl font-semibold">Ingresos vs gastos</h2>
        </div>
        <div className="flex gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Ingresos
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-400" /> Gastos
          </span>
        </div>
      </div>
      <div className="flex items-end gap-6 overflow-x-auto py-4">
        {chartData.map((entry) => {
          const date = parseISO(`${entry.month}-01`);
          const label = format(date, "LLL yyyy");
          const incomeHeight = (entry.income / maxValue) * 160;
          const expenseHeight = (entry.expenses / maxValue) * 160;

          return (
            <div key={entry.month} className="flex flex-col items-center gap-2 text-xs">
              <div className="flex gap-3 text-[11px]">
                <span className="font-semibold text-emerald-300">{formatCurrency(entry.income)}</span>
                <span className="font-semibold text-rose-300">{formatCurrency(entry.expenses)}</span>
              </div>
              <div className="flex items-end gap-2">
                <div
                  className="w-5 rounded-full bg-emerald-400/80"
                  style={{ height: `${Math.max(incomeHeight, 4)}px` }}
                  aria-label={`Ingresos ${formatCurrency(entry.income)}`}
                />
                <div
                  className="w-5 rounded-full bg-rose-400/80"
                  style={{ height: `${Math.max(expenseHeight, 4)}px` }}
                  aria-label={`Gastos ${formatCurrency(entry.expenses)}`}
                />
              </div>
              <span className="font-semibold uppercase tracking-wide text-slate-200">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
