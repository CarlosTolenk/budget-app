import { format } from "date-fns";
import { bucketCopy } from "@/domain/value-objects/bucket";
import { serverContainer } from "@/infrastructure/config/server-container";
import { CategoryForm } from "@/components/forms/category-form";
import { RuleForm } from "@/components/forms/rule-form";
import { IncomeForm } from "@/components/forms/income-form";
import { formatCurrency, formatMonthLabel, formatPercent } from "@/lib/format";
import { requireAuth } from "@/lib/auth/require-auth";
import { IncomeList } from "@/components/budget/income-list";
import { CategoryManager } from "@/components/budget/category-manager";
import { RuleManager } from "@/components/budget/rule-manager";

type BudgetPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolveIncomeMonth(value?: string): string {
  const fallback = format(new Date(), "yyyy-MM");
  if (!value) {
    return fallback;
  }
  const monthRegex = /^\d{4}-\d{2}$/;
  return monthRegex.test(value) ? value : fallback;
}

export default async function BudgetPage({ searchParams }: BudgetPageProps) {
  const { appUser } = await requireAuth();
  const userId = appUser.id;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const incomeMonthParam = typeof resolvedSearch?.incomeMonth === "string" ? resolvedSearch.incomeMonth : undefined;
  const incomeMonth = resolveIncomeMonth(incomeMonthParam);
  const container = serverContainer();
  const [summary, categories, incomes, rules] = await Promise.all([
    container.getDashboardSummaryUseCase.execute({ userId, monthId: incomeMonth }),
    container.listCategoriesUseCase.execute(userId),
    container.listIncomesUseCase.execute(userId, incomeMonth),
    container.listRulesUseCase.execute(userId),
  ]);

  const byBucket = categories.reduce<Record<string, typeof categories>>((acc, category) => {
    acc[category.bucket] = acc[category.bucket] ? [...acc[category.bucket], category] : [category];
    return acc;
  }, {});
  const bucketSummaryMap = summary.buckets.reduce<Record<string, (typeof summary.buckets)[number]>>((acc, bucket) => {
    acc[bucket.bucket] = bucket;
    return acc;
  }, {});

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-slate-400">Configuración · {formatMonthLabel(summary.month)}</p>
        <h1 className="text-3xl font-semibold">Ingresos y categorías</h1>
        <p className="text-base text-slate-300">Registra ingresos y deja que el sistema calcule 50/30/20 automáticamente.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <IncomeForm month={incomeMonth} />
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Ingresos declarados</h2>
              <p className="text-sm text-slate-300">Mostrando {formatMonthLabel(incomeMonth)}</p>
            </div>
            <form className="flex items-center gap-2 text-xs md:text-sm" method="GET">
              <input
                type="month"
                name="incomeMonth"
                defaultValue={incomeMonth}
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                aria-label="Mes de ingresos"
              />
              <button
                type="submit"
                className="rounded-full border border-white/20 px-3 py-2 font-semibold text-white transition hover:border-white/40"
              >
                Ver mes
              </button>
            </form>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
            <span>Total mensual planificado</span>
            <span className="text-2xl font-semibold text-white">{formatCurrency(totalIncome)}</span>
          </div>
          <IncomeList incomes={incomes} />
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <h2 className="text-xl font-semibold">Categorías por bucket</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(Object.keys(bucketCopy) as Array<keyof typeof bucketCopy>).map((bucket) => {
            const bucketCategories = byBucket[bucket] ?? [];
            const copy = bucketCopy[bucket];
            return (
              <article key={bucket} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{copy.label}</span>
                  <span>{formatPercent(copy.targetRatio)}</span>
                </div>
                <p className="text-xs text-slate-400">
                  Meta sugerida {formatCurrency((bucketSummaryMap[bucket]?.target ?? summary.income * copy.targetRatio) || 0)}
                </p>
                <p className="text-xs text-slate-300">
                  Plan ideal registrado {formatCurrency(bucketSummaryMap[bucket]?.planned ?? 0)}
                </p>
                {(() => {
                  const target = bucketSummaryMap[bucket]?.target ?? summary.income * copy.targetRatio;
                  const planned = bucketSummaryMap[bucket]?.planned ?? 0;
                  const delta = target - planned;
                  const status =
                    planned === 0
                      ? "Sin asignar"
                      : delta >= 0
                        ? "Dentro de la meta"
                        : "Sobre la meta";
                  return (
                    <p className={`text-xs font-semibold ${delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {status} · {formatCurrency(Math.abs(delta))}
                    </p>
                  );
                })()}
                <ul className="mt-3 space-y-2 text-sm">
                  {bucketCategories.length ? (
                    bucketCategories.map((category) => (
                      <li key={category.id} className="rounded-lg bg-white/5 px-3 py-2 text-slate-100">
                        <div className="flex items-center justify-between gap-3">
                          <span>{category.name}</span>
                          <span className="text-xs text-slate-300">{formatCurrency(category.idealMonthlyAmount ?? 0)}</span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-400">Aún sin categorías</li>
                  )}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
        <CategoryForm />
        <CategoryManager categories={categories} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
        <RuleForm categories={categories} />
        <RuleManager rules={rules} categories={categories} />
      </section>
    </div>
  );
}
