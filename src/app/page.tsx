import { format } from "date-fns";
import clsx from "clsx";
import { bucketCopy } from "@/domain/value-objects/bucket";
import { serverContainer } from "@/infrastructure/config/server-container";
import { formatCurrency, formatPercent } from "@/lib/format";
import { YearlyChart } from "@/components/dashboard/yearly-chart";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import { requireAuth } from "@/lib/auth/require-auth";
import { CategorySpendingChart } from "@/components/dashboard/category-spending-chart";

type DashboardPageProps = {
  searchParams?: Promise<{ month?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  noStore();
  await requireAuth();
  const headersList = await headers();
  const headerUrl = headersList.get("next-url");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const headerMonth =
    headerUrl && headerUrl.includes("?")
      ? new URL(headerUrl, "http://localhost").searchParams.get("month") ?? undefined
      : undefined;
  const requestedMonth =
    typeof resolvedSearchParams?.month === "string" ? resolvedSearchParams.month : headerMonth;
  const monthRegex = /^\d{4}-\d{2}$/;
  const selectedMonth = requestedMonth && monthRegex.test(requestedMonth) ? requestedMonth : format(new Date(), "yyyy-MM");
  const container = serverContainer();
  const [summary, transactions, categories, rules, yearlyOverview] = await Promise.all([
    container.getDashboardSummaryUseCase.execute({ monthId: selectedMonth, now: new Date() }),
    container.listTransactionsUseCase.execute({ monthId: selectedMonth }),
    container.listCategoriesUseCase.execute(),
    container.listRulesUseCase.execute(),
    container.getYearlyOverviewUseCase.execute({ monthsBack: 6, baseMonth: selectedMonth }),
  ]);

  const remainingDescription =
    summary.periodStatus === "current"
      ? `${summary.remainingDays} días restantes del mes`
      : summary.periodStatus === "past"
        ? "Mes finalizado"
        : "Mes programado";

  const categoryLabelMap = new Map(categories.map((category) => [category.id, category.name]));
  const spendingByCategory = transactions.reduce<Record<string, number>>((acc, transaction) => {
    if (transaction.amount >= 0) {
      return acc;
    }
    const key = transaction.categoryId ?? "uncategorized";
    const current = acc[key] ?? 0;
    acc[key] = current + Math.abs(transaction.amount);
    return acc;
  }, {});
  const categorySpending = Object.entries(spendingByCategory)
    .map(([id, amount]) => ({
      id,
      label: id === "uncategorized" ? "Sin categoría" : categoryLabelMap.get(id) ?? "Sin categoría",
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-slate-400">Personal Budget · {summary.month}</p>
        <h1 className="text-3xl font-semibold">Regla 50/30/20 en acción</h1>
        <p className="text-base text-slate-300">
          Ingresos declarados {formatCurrency(summary.income)} · {remainingDescription}
        </p>
        <MonthSwitcher month={selectedMonth} />
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {summary.buckets.map((bucket) => {
          const copy = bucketCopy[bucket.bucket];
          const progress = bucket.target ? Math.min(bucket.spent / bucket.target, 1) : 0;
          const delta = bucket.target - bucket.spent;

          return (
            <article key={bucket.bucket} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>{copy.label}</span>
                <span>{formatPercent(bucket.targetRatio)}</span>
              </div>
              <p className="mt-4 text-2xl font-semibold">{formatCurrency(bucket.spent)}</p>
              <p className="text-sm text-slate-300">Meta {formatCurrency(bucket.target)}</p>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-emerald-400 transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className={clsx("mt-2 text-sm", delta >= 0 ? "text-emerald-300" : "text-rose-300")}>
                {delta >= 0 ? "Disponible" : "Exceso"}: {formatCurrency(Math.abs(delta))}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <YearlyChart data={yearlyOverview.months} />
      </section>

      <CategorySpendingChart data={categorySpending} month={summary.month} />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Transacciones</h2>
              <p className="text-sm text-slate-300">Últimos movimientos del mes</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
              {transactions.length}
            </span>
          </div>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-b-0">
                <div>
                  <p className="font-medium">{transaction.merchant}</p>
                  <p className="text-xs text-slate-400">
                    {format(transaction.date, "dd MMM")} · {transaction.bucket}
                  </p>
                </div>
                <p
                  className={clsx(
                    "text-right text-lg font-semibold",
                    transaction.amount >= 0 ? "text-emerald-300" : "text-rose-300",
                  )}
                >
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h2 className="text-xl font-semibold">Categorías</h2>
          <p className="text-sm text-slate-300">Resumen de buckets</p>
          <ul className="mt-4 space-y-3">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-slate-400">{category.bucket}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Rules Manager</h2>
            <p className="text-sm text-slate-300">De merchant → categoría usando regex priorizadas</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {rules.map((rule) => {
            const category = categories.find((cat) => cat.id === rule.categoryId);
            return (
              <div key={rule.id} className="rounded-xl border border-white/5 p-4 text-sm text-slate-100">
                <p className="font-mono text-sm text-emerald-200">/{rule.pattern}/</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">Priority #{rule.priority}</p>
                <p className="text-sm font-semibold">{category?.name}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
