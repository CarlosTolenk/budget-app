import { bucketCopy } from "@/domain/value-objects/bucket";
import { serverContainer } from "@/infrastructure/config/server-container";
import { CategoryForm } from "@/components/forms/category-form";
import { RuleForm } from "@/components/forms/rule-form";
import { IncomeForm } from "@/components/forms/income-form";
import { formatCurrency, formatPercent } from "@/lib/format";
import { requireAuth } from "@/lib/auth/require-auth";
import { IncomeList } from "@/components/budget/income-list";
import { CategoryManager } from "@/components/budget/category-manager";

export default async function BudgetPage() {
  await requireAuth();
  const container = serverContainer();
  const [summary, categories, incomes] = await Promise.all([
    container.getDashboardSummaryUseCase.execute(),
    container.listCategoriesUseCase.execute(),
    container.listIncomesUseCase.execute(),
  ]);

  const byBucket = categories.reduce<Record<string, typeof categories>>((acc, category) => {
    acc[category.bucket] = acc[category.bucket] ? [...acc[category.bucket], category] : [category];
    return acc;
  }, {});

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-slate-400">Configuración · {summary.month}</p>
        <h1 className="text-3xl font-semibold">Ingresos y categorías</h1>
        <p className="text-base text-slate-300">Registra ingresos y deja que el sistema calcule 50/30/20 automáticamente.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <IncomeForm month={summary.month} />
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Ingresos declarados</h2>
              <p className="text-sm text-slate-300">{summary.month}</p>
            </div>
            <span className="text-2xl font-semibold">{formatCurrency(totalIncome)}</span>
          </div>
          <IncomeList incomes={incomes} />
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <CategoryForm />
        <RuleForm categories={categories} />
      </section>

      <CategoryManager categories={categories} />

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
                <p className="text-xs text-slate-400">Meta sugerida {formatCurrency(summary.income * copy.targetRatio)}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {bucketCategories.length ? (
                    bucketCategories.map((category) => (
                      <li key={category.id} className="rounded-lg bg-white/5 px-3 py-2 text-slate-100">
                        {category.name}
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
    </div>
  );
}
