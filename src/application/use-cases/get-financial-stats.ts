import { addMonths, format, isAfter, parseISO, subMonths } from "date-fns";
import { CategoryRepository, IncomeRepository, TransactionRepository } from "@/domain/repositories";
import { Category } from "@/domain/categories/category";

interface FinancialStatsInput {
  userId: string;
  fromMonth?: string;
  toMonth?: string;
  topLimit?: number;
}

interface MonthlyStat {
  month: string;
  income: number;
  expenses: number;
  net: number;
  transactions: number;
}

interface CategoryMonthlyTotal {
  month: string;
  total: number;
}

interface CategoryStat {
  id: string;
  name: string;
  bucket?: Category["userBucket"];
  total: number;
  monthlyTotals: CategoryMonthlyTotal[];
}

interface FinancialStatsResult {
  period: { from: string; to: string; months: string[] };
  totals: { income: number; expenses: number; net: number };
  months: MonthlyStat[];
  topSpendingCategories: CategoryStat[];
  highestIncomeMonth?: { month: string; income: number };
  highestExpenseMonth?: { month: string; expenses: number };
}

const MONTH_REGEX = /^\d{4}-\d{2}$/;

export class GetFinancialStatsUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly incomeRepository: IncomeRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute({ userId, fromMonth, toMonth, topLimit = 5 }: FinancialStatsInput): Promise<FinancialStatsResult> {
    const now = new Date();
    const defaultTo = now;
    const defaultFrom = subMonths(defaultTo, 5);

    const resolvedFromDate = this.resolveMonth(fromMonth, defaultFrom);
    const resolvedToDate = this.resolveMonth(toMonth, defaultTo);
    const { start, end } = this.normalizeRange(resolvedFromDate, resolvedToDate);
    const monthIds = this.buildMonthRange(start, end);

    const categories = await this.categoryRepository.listAll(userId);
    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const categoryTotals = new Map<string, number>();
    const categoryMonthlyTotals = new Map<string, Map<string, number>>();
    const monthlyStats: MonthlyStat[] = [];

    for (const monthId of monthIds) {
      const [transactions, income] = await Promise.all([
        this.transactionRepository.findByMonth(monthId, userId),
        this.incomeRepository.getTotalForMonth(monthId, userId),
      ]);

      const expenses = transactions
        .filter((transaction) => transaction.amount < 0)
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

      transactions.forEach((transaction) => {
        if (transaction.amount >= 0) {
          return;
        }
        const key = transaction.categoryId ?? "uncategorized";
        const absoluteAmount = Math.abs(transaction.amount);
        categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + absoluteAmount);

        let monthTotals = categoryMonthlyTotals.get(key);
        if (!monthTotals) {
          monthTotals = new Map<string, number>();
          categoryMonthlyTotals.set(key, monthTotals);
        }
        monthTotals.set(monthId, (monthTotals.get(monthId) ?? 0) + absoluteAmount);
      });

      monthlyStats.push({
        month: monthId,
        income,
        expenses,
        net: income - expenses,
        transactions: transactions.length,
      });
    }

    const topSpendingCategories = Array.from(categoryTotals.entries())
      .map(([categoryId, total]): CategoryStat => {
        const category = categoryMap.get(categoryId);
        const monthTotals = categoryMonthlyTotals.get(categoryId) ?? new Map<string, number>();
        return {
          id: categoryId,
          name: category?.name ?? "Sin categoría",
          bucket: category?.userBucket,
          total,
          monthlyTotals: monthIds.map((month) => ({
            month,
            total: monthTotals.get(month) ?? 0,
          })),
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, topLimit);

    const totals = monthlyStats.reduce(
      (acc, month) => {
        acc.income += month.income;
        acc.expenses += month.expenses;
        acc.net += month.net;
        return acc;
      },
      { income: 0, expenses: 0, net: 0 },
    );

    const highestIncomeMonth = monthlyStats.reduce<{ month: string; income: number } | undefined>((best, current) => {
      if (!best || current.income > (best?.income ?? 0)) {
        return { month: current.month, income: current.income };
      }
      return best;
    }, undefined);

    const highestExpenseMonth = monthlyStats.reduce<{ month: string; expenses: number } | undefined>((best, current) => {
      if (!best || current.expenses > (best?.expenses ?? 0)) {
        return { month: current.month, expenses: current.expenses };
      }
      return best;
    }, undefined);

    return {
      period: { from: monthIds[0], to: monthIds[monthIds.length - 1], months: monthIds },
      totals,
      months: monthlyStats,
      topSpendingCategories,
      highestIncomeMonth,
      highestExpenseMonth,
    };
  }

  private resolveMonth(value: string | undefined, fallback: Date): Date {
    if (value && MONTH_REGEX.test(value)) {
      return parseISO(`${value}-01`);
    }
    return fallback;
  }

  private normalizeRange(from: Date, to: Date) {
    if (isAfter(from, to)) {
      return { start: to, end: from };
    }
    return { start: from, end: to };
  }

  private buildMonthRange(start: Date, end: Date) {
    const months: string[] = [];
    let cursor = new Date(start.getTime());

    while (!isAfter(cursor, end)) {
      months.push(format(cursor, "yyyy-MM"));
      cursor = addMonths(cursor, 1);
    }

    return months;
  }
}
