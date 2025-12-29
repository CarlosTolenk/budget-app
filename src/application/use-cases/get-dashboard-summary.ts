import { format, parseISO } from "date-fns";
import { BudgetRepository, CategoryRepository, TransactionRepository } from "@/domain/repositories";
import { Bucket, bucketCopy, bucketOrder } from "@/domain/value-objects/bucket";
import { DashboardSummary } from "../dtos/dashboard";

interface GetDashboardSummaryInput {
  userId: string;
  monthId?: string;
  now?: Date;
}

export class GetDashboardSummaryUseCase {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute({ userId, monthId, now = new Date() }: GetDashboardSummaryInput): Promise<DashboardSummary> {
    const resolvedMonthId = monthId ?? format(now, "yyyy-MM");
    const [budget, transactions, categories] = await Promise.all([
      this.budgetRepository.getByMonth(resolvedMonthId, userId),
      this.transactionRepository.findByMonth(resolvedMonthId, userId),
      this.categoryRepository.listAll(userId),
    ]);

    const income = budget?.income ?? transactions.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);

    const bucketTotals = bucketOrder.map((bucket) => {
      const spent = transactions
        .filter((transaction) => transaction.bucket === bucket)
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
      const planned = categories
        .filter((category) => category.bucket === bucket)
        .reduce((sum, category) => sum + (category.idealMonthlyAmount ?? 0), 0);

      const targetRatio = bucketCopy[bucket].targetRatio;
      const target = budget
        ? this.pickTarget(bucket, budget)
        : Number((income * targetRatio).toFixed(2));

      return {
        bucket,
        spent,
        planned,
        target,
        targetRatio,
      };
    });

    const year = Number(resolvedMonthId.slice(0, 4));
    const month = Number(resolvedMonthId.slice(5));
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentMonthId = format(now, "yyyy-MM");
    const selectedDate = parseISO(`${resolvedMonthId}-01`);
    const currentDate = parseISO(`${currentMonthId}-01`);

    let periodStatus: "past" | "current" | "future" = "current";
    if (selectedDate < currentDate) {
      periodStatus = "past";
    } else if (selectedDate > currentDate) {
      periodStatus = "future";
    }

    const remainingDays =
      periodStatus === "current"
        ? Math.max(daysInMonth - now.getDate(), 0)
        : periodStatus === "past"
          ? 0
          : daysInMonth;

    const totalSavingsRate = income
      ? 1 - bucketTotals.slice(0, 2).reduce((sum, bucket) => sum + bucket.spent, 0) / income
      : 0;

    return {
      month: resolvedMonthId,
      income,
      buckets: bucketTotals,
      totalSavingsRate,
      remainingDays,
      periodStatus,
    };
  }

  private pickTarget(bucket: Bucket, budget: { needsTarget: number; wantsTarget: number; savingsTarget: number }) {
    switch (bucket) {
      case "NEEDS":
        return Number(budget.needsTarget);
      case "WANTS":
        return Number(budget.wantsTarget);
      default:
        return Number(budget.savingsTarget);
    }
  }
}
