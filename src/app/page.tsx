import { format } from "date-fns";
import clsx from "clsx";
import { bucketCopy } from "@/domain/value-objects/bucket";
import { serverContainer } from "@/infrastructure/config/server-container";
import { formatCurrency, formatInAppTimezone, formatMonthLabel, formatPercent } from "@/lib/format";
import { YearlyChart } from "@/components/dashboard/yearly-chart";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import { requireAuth } from "@/lib/auth/require-auth";
import { CategorySpendingChart } from "@/components/dashboard/category-spending-chart";
import { PlanSummaryCard } from "@/components/dashboard/plan-summary-card";

type DashboardPageProps = {
  searchParams?: Promise<{ month?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  noStore();
  const { appUser } = await requireAuth();
  const userId = appUser.id;
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
  const [summary, transactions, categories, yearlyOverview] = await Promise.all([
    container.getDashboardSummaryUseCase.execute({ userId, monthId: selectedMonth, now: new Date() }),
    container.listTransactionsUseCase.execute({ userId, monthId: selectedMonth }),
    container.listCategoriesUseCase.execute(userId),
    container.getYearlyOverviewUseCase.execute({ userId, monthsBack: 6, baseMonth: selectedMonth }),
  ]);

  const remainingDescription =
    summary.periodStatus === "current"
      ? `${summary.remainingDays} días restantes del mes`
      : summary.periodStatus === "past"
        ? "Mes finalizado"
        : "Mes programado";
  const isCustomMode = appUser.bucketMode === "CUSTOM";

  const spendingByCategory = transactions.reduce<Record<string, number>>((acc, transaction) => {
    if (transaction.amount >= 0) {
      return acc;
    }
    const key = transaction.categoryId ?? "uncategorized";
    const current = acc[key] ?? 0;
    acc[key] = current + Math.abs(transaction.amount);
    return acc;
  }, {});
  const categorySpending = [
    ...categories
      .map((category) => {
        const bucket = category.bucket ? bucketCopy[category.bucket] : undefined;
        return {
          id: category.id,
          label: category.name,
          bucketLabel: bucket?.label,
          planned: category.idealMonthlyAmount ?? 0,
          actual: spendingByCategory[category.id] ?? 0,
        };
      }),
    ...(spendingByCategory.uncategorized
      ? [
          {
            id: "uncategorized",
            label: "Sin categoría",
            bucketLabel: undefined,
            planned: 0,
            actual: spendingByCategory.uncategorized,
          },
        ]
      : []),
  ]
    .filter((entry) => entry.actual > 0 || entry.planned > 0)
    .sort((a, b) => b.actual - a.actual);
  const aggregatedBucketStats = summary.buckets.reduce(
    (acc, bucket) => {
      const planDelta = bucket.planned - bucket.spent;
      const planVsTarget = bucket.target - bucket.planned;
      const targetDelta = bucket.target - bucket.spent;
      return {
        planned: acc.planned + bucket.planned,
        spent: acc.spent + bucket.spent,
        target: acc.target + bucket.target,
        planDelta: acc.planDelta + planDelta,
        planVsTarget: acc.planVsTarget + planVsTarget,
        targetDelta: acc.targetDelta + targetDelta,
      };
    },
    { planned: 0, spent: 0, target: 0, planDelta: 0, planVsTarget: 0, targetDelta: 0 },
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-slate-400">Personal Budget · {formatMonthLabel(summary.month)}</p>
        <h1 className="text-3xl font-semibold">
          {isCustomMode ? "Tus buckets personalizados" : "Regla 50/30/20 en acción"}
        </h1>
        <p className="text-base text-slate-300">
          Ingresos declarados {formatCurrency(summary.income)} · {remainingDescription}
        </p>
        <MonthSwitcher month={selectedMonth} />
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-3">
          <PlanSummaryCard
            planned={aggregatedBucketStats.planned}
            spent={aggregatedBucketStats.spent}
            target={aggregatedBucketStats.target}
            planDelta={aggregatedBucketStats.planDelta}
            planVsTarget={aggregatedBucketStats.planVsTarget}
            targetDelta={aggregatedBucketStats.targetDelta}
            bucketMode={appUser.bucketMode}
          />
        </div>
        {summary.buckets.map((bucket) => {
          const copy = bucketCopy[bucket.bucket];
          const progress = bucket.target ? Math.min(bucket.spent / bucket.target, 1) : 0;
          const delta = bucket.target - bucket.spent;
          const planDelta = bucket.planned - bucket.spent;
          const planVsTarget = bucket.target - bucket.planned;

          return (
            <article key={bucket.bucket} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>{copy.label}</span>
                {bucket.targetRatio !== null && bucket.targetRatio !== undefined ? (
                  <span>{formatPercent(bucket.targetRatio)}</span>
                ) : null}
              </div>
              <p className="mt-4 text-2xl font-semibold">{formatCurrency(bucket.spent)}</p>
              <p className="text-sm text-slate-300">Real gastado</p>
              <div className="mt-2 text-xs text-slate-400">
                <p>Plan ideal {formatCurrency(bucket.planned)}</p>
                <p>{isCustomMode ? "Meta mensual" : "Meta 50/30/20"} {formatCurrency(bucket.target)}</p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-emerald-400 transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className={clsx("mt-2 text-sm", planDelta >= 0 ? "text-emerald-300" : "text-rose-300")}>
                {planDelta >= 0 ? "Disponible del plan" : "Sobre el plan"}: {formatCurrency(Math.abs(planDelta))}
              </p>
              <p className={clsx("text-sm", planVsTarget >= 0 ? "text-emerald-300" : "text-rose-300")}>
                {planVsTarget >= 0 ? "Meta por asignar" : "Meta excedida"}: {formatCurrency(Math.abs(planVsTarget))}
              </p>
              <p className={clsx("text-sm", delta >= 0 ? "text-emerald-300" : "text-rose-300")}>
                {delta >= 0 ? "Disponible de la meta" : "Exceso total"}: {formatCurrency(Math.abs(delta))}
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
        <article className="flex h-[420px] flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Transacciones</h2>
              <p className="text-sm text-slate-300">Últimos movimientos del mes</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
              {transactions.length}
            </span>
          </div>
          <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-2">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-b-0">
                <div>
                  <p className="font-medium">{transaction.merchant}</p>
                  <p className="text-xs text-slate-400">
                    {formatInAppTimezone(transaction.date, { day: "2-digit", month: "short" }).replace(".", "")} ·{" "}
                    {transaction.bucket ? bucketCopy[transaction.bucket]?.label ?? transaction.bucket : "Sin renglón"}
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

        <article className="flex h-[420px] flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h2 className="text-xl font-semibold">Categorías</h2>
          <p className="text-sm text-slate-300">Resumen de renglones</p>
          <ul className="mt-4 flex-1 space-y-3 overflow-y-auto pr-2">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-slate-400">
                    {category.bucket ? bucketCopy[category.bucket]?.label ?? category.bucket : "Sin renglón"}
                  </p>
                  <p className="text-xs text-slate-300">
                    Plan {formatCurrency(category.idealMonthlyAmount ?? 0)} · Real{" "}
                    {formatCurrency(spendingByCategory[category.id] ?? 0)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

    </div>
  );
}
