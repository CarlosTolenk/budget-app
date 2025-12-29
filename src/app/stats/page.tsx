import { unstable_noStore as noStore } from "next/cache";
import { format, parseISO } from "date-fns";
import clsx from "clsx";
import { requireAuth } from "@/lib/auth/require-auth";
import { serverContainer } from "@/infrastructure/config/server-container";
import { formatCurrency } from "@/lib/format";
import { TopCategorySpending } from "@/components/stats/top-category-spending";

type StatsSearchParams = {
  from?: string;
  to?: string;
  limit?: string;
};

type StatsPageProps = {
  searchParams?: Promise<StatsSearchParams>;
};

export const dynamic = "force-dynamic";

export default async function StatsPage({ searchParams }: StatsPageProps) {
  noStore();
  const { appUser } = await requireAuth();
  const userId = appUser.id;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const fromMonth = typeof resolvedSearchParams?.from === "string" ? resolvedSearchParams.from : undefined;
  const toMonth = typeof resolvedSearchParams?.to === "string" ? resolvedSearchParams.to : undefined;
  const limit =
    typeof resolvedSearchParams?.limit === "string" && !Number.isNaN(Number(resolvedSearchParams.limit))
      ? Number(resolvedSearchParams.limit)
      : undefined;

  const container = serverContainer();
  const stats = await container.getFinancialStatsUseCase.execute({
    userId,
    fromMonth,
    toMonth,
    topLimit: limit,
  });
  const topLimitValue = limit ?? (stats.topSpendingCategories.length || 5);

  const readableRange = `${format(parseISO(`${stats.period.from}-01`), "MMMM yyyy")} → ${format(parseISO(`${stats.period.to}-01`), "MMMM yyyy")}`;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-slate-400">Laboratorio financiero</p>
        <h1 className="text-3xl font-semibold">Estadísticas y análisis</h1>
        <p className="text-base text-slate-300">
          Explora tus datos para encontrar patrones de gasto e ingresos. Rango seleccionado: {readableRange}.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <form className="grid gap-4 md:grid-cols-4" action="/stats">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="from">
              Desde (mes)
            </label>
            <input
              id="from"
              name="from"
              type="month"
              defaultValue={stats.period.from}
              className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="to">
              Hasta (mes)
            </label>
            <input
              id="to"
              name="to"
              type="month"
              defaultValue={stats.period.to}
              className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="limit">
              Top categorías
            </label>
            <input
              id="limit"
              name="limit"
              type="number"
              min={1}
              max={12}
              defaultValue={String(topLimitValue)}
              className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-400/90 px-4 py-3 text-center text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300"
            >
              Actualizar análisis
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-400">Ingresos acumulados</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(stats.totals.income)}</p>
          <p className="text-sm text-slate-300">Suma de ingresos en el rango seleccionado.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-400">Gastos acumulados</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(stats.totals.expenses)}</p>
          <p className="text-sm text-slate-300">Incluye todo gasto registrado (cifras positivas representan egresos).</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-400">Resultado neto</p>
          <p className={clsx("mt-2 text-3xl font-semibold", stats.totals.net >= 0 ? "text-emerald-300" : "text-rose-300")}>
            {formatCurrency(stats.totals.net)}
          </p>
          <p className="text-sm text-slate-300">Ingresos menos gastos en el periodo.</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h2 className="text-xl font-semibold">Mes con más ingresos</h2>
          <p className="text-sm text-slate-300">Descubre cuándo alcanzaste el mayor flujo positivo.</p>
          {stats.highestIncomeMonth ? (
            <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-5">
              <p className="text-sm uppercase tracking-wide text-emerald-200">
                {format(parseISO(`${stats.highestIncomeMonth.month}-01`), "MMMM yyyy")}
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-200">
                {formatCurrency(stats.highestIncomeMonth.income)}
              </p>
              <p className="text-sm text-emerald-100/70">Total de ingresos registrados en ese mes.</p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-400">Aún no hay ingresos capturados en el periodo.</p>
          )}
          <p className="mt-6 text-sm text-slate-300">
            Usa esta referencia para alinear tus metas de ahorro o evaluar bonificaciones y otros ingresos variables.
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h2 className="text-xl font-semibold">Mes con más gastos</h2>
          <p className="text-sm text-slate-300">Identifica cuándo tuviste la mayor presión de egresos.</p>
          {stats.highestExpenseMonth ? (
            <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/5 p-5">
              <p className="text-sm uppercase tracking-wide text-rose-200">
                {format(parseISO(`${stats.highestExpenseMonth.month}-01`), "MMMM yyyy")}
              </p>
              <p className="mt-2 text-3xl font-semibold text-rose-200">
                {formatCurrency(stats.highestExpenseMonth.expenses)}
              </p>
              <p className="text-sm text-rose-100/70">Total de gastos registrados en ese mes.</p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-400">Aún no hay gastos capturados en el periodo.</p>
          )}
          <p className="mt-6 text-sm text-slate-300">
            Usa este dato para detectar temporadas de mayor consumo y anticipar presupuestos.
          </p>
        </article>
      </section>

      <TopCategorySpending categories={stats.topSpendingCategories} />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Detalle mensual</h2>
            <p className="text-sm text-slate-300">Ingresos, gastos y neto por cada mes del rango.</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="pb-2 pr-4 font-semibold">Mes</th>
                <th className="pb-2 pr-4 font-semibold">Ingresos</th>
                <th className="pb-2 pr-4 font-semibold">Gastos</th>
                <th className="pb-2 pr-4 font-semibold">Resultado</th>
                <th className="pb-2 font-semibold"># Movimientos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.months.map((month) => (
                <tr key={month.month} className="text-slate-200">
                  <td className="py-3 pr-4">{format(parseISO(`${month.month}-01`), "MMMM yyyy")}</td>
                  <td className="py-3 pr-4">{formatCurrency(month.income)}</td>
                  <td className="py-3 pr-4">{formatCurrency(month.expenses)}</td>
                  <td
                    className={clsx(
                      "py-3 pr-4 font-semibold",
                      month.net >= 0 ? "text-emerald-300" : "text-rose-300",
                    )}
                  >
                    {formatCurrency(month.net)}
                  </td>
                  <td className="py-3">{month.transactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
