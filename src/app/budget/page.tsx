import { format } from "date-fns";
import { serverContainer } from "@/infrastructure/config/server-container";
import { CategoryForm } from "@/components/forms/category-form";
import { RuleForm } from "@/components/forms/rule-form";
import { IncomeForm } from "@/components/forms/income-form";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import { requireAuth } from "@/lib/auth/require-auth";
import { IncomeList } from "@/components/budget/income-list";
import { CategoryManager } from "@/components/budget/category-manager";
import { RuleManager } from "@/components/budget/rule-manager";
import { BucketModeSelector } from "@/components/budget/bucket-mode-selector";
import { UserBucketsGrid } from "@/components/budget/user-buckets-grid";

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
  const [summary, categories, incomes, rules, userBuckets] = await Promise.all([
    container.getDashboardSummaryUseCase.execute({ userId, monthId: incomeMonth }),
    container.listCategoriesUseCase.execute(userId),
    container.listIncomesUseCase.execute(userId, incomeMonth),
    container.listRulesUseCase.execute(userId),
    container.userBucketRepository.listByUserId(userId),
  ]);

  const categoriesByBucketId = categories.reduce<Record<string, typeof categories>>((acc, category) => {
    const key = category.userBucketId;
    acc[key] = acc[key] ? [...acc[key], category] : [category];
    return acc;
  }, {});
  const bucketSummaryMap = summary.buckets.reduce<Record<string, (typeof summary.buckets)[number]>>((acc, bucket) => {
    acc[bucket.bucketId] = bucket;
    return acc;
  }, {});
  const activeBuckets = userBuckets.filter((bucket) => bucket.mode === appUser.bucketMode);
  const customBuckets = userBuckets.filter((bucket) => bucket.mode === "CUSTOM");
  const remainingSlots = Math.max(0, 4 - customBuckets.length);
  const canAddMoreBuckets = appUser.bucketMode === "CUSTOM" && remainingSlots > 0;

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-slate-400">Configuración · {formatMonthLabel(summary.month)}</p>
        <h1 className="text-3xl font-semibold">Ingresos y categorías</h1>
        <p className="text-base text-slate-300">Registra ingresos y deja que el sistema calcule 50/30/20 automáticamente.</p>
      </header>

      <BucketModeSelector currentMode={appUser.bucketMode} />

      <UserBucketsGrid
        bucketMode={appUser.bucketMode}
        buckets={activeBuckets}
        categoriesByBucketId={categoriesByBucketId}
        bucketSummaries={bucketSummaryMap}
        canAddMore={canAddMoreBuckets}
        remainingSlots={remainingSlots}
      />

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

      <section className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
        <CategoryForm userBuckets={userBuckets} bucketMode={appUser.bucketMode} />
        <CategoryManager categories={categories} userBuckets={userBuckets} bucketMode={appUser.bucketMode} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
        <RuleForm categories={categories} userBuckets={userBuckets} bucketMode={appUser.bucketMode} />
        <RuleManager rules={rules} categories={categories} userBuckets={userBuckets} bucketMode={appUser.bucketMode} />
      </section>
    </div>
  );
}
