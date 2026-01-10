import { format, parseISO } from "date-fns";
import { BudgetRepository, CategoryRepository, TransactionRepository, UserBucketRepository } from "@/domain/repositories";
import { presetBucketCopy } from "@/domain/user-buckets/preset-buckets";
import { DashboardSummary } from "../dtos/dashboard";
import { BucketMode } from "@/domain/users/user";

interface GetDashboardSummaryInput {
  userId: string;
  monthId?: string;
  now?: Date;
  bucketMode?: BucketMode;
}

export class GetDashboardSummaryUseCase {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly userBucketRepository: UserBucketRepository,
  ) {}

  async execute({ userId, monthId, now = new Date(), bucketMode = "PRESET" }: GetDashboardSummaryInput): Promise<DashboardSummary> {
    const resolvedMonthId = monthId ?? format(now, "yyyy-MM");
    const [budget, transactions, categories, userBuckets] = await Promise.all([
      this.budgetRepository.getByMonth(resolvedMonthId, userId),
      this.transactionRepository.findByMonth(resolvedMonthId, userId),
      this.categoryRepository.listAll(userId),
      this.userBucketRepository.listByUserId(userId),
    ]);

    const income = budget?.income ?? transactions.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);

    const activeBuckets = userBuckets.filter((bucket) => bucket.mode === bucketMode);
    const bucketsToSummarize = activeBuckets.length ? activeBuckets : userBuckets;

    const bucketTotals = bucketsToSummarize.map((bucket) => {
      const spent = transactions
        .filter((transaction) => transaction.userBucketId === bucket.id)
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
      const planned = categories
        .filter((category) => category.userBucketId === bucket.id)
        .reduce((sum, category) => sum + (category.idealMonthlyAmount ?? 0), 0);

      const budgetTarget = budget?.buckets.find((entry) => entry.userBucketId === bucket.id);
      const fallbackRatio =
        bucket.mode === "PRESET" && bucket.presetKey ? presetBucketCopy[bucket.presetKey].targetRatio : null;
      const target =
        budgetTarget?.targetAmount ??
        (bucket.mode === "PRESET" && fallbackRatio ? Number((income * fallbackRatio).toFixed(2)) : 0);

      return {
        bucketId: bucket.id,
        presetKey: bucket.presetKey,
        bucketDetails: bucket,
        spent,
        planned,
        target,
        targetRatio: fallbackRatio,
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

    const nonSavingsSpent = bucketTotals
      .filter((entry) => entry.presetKey !== "SAVINGS")
      .reduce((sum, entry) => sum + entry.spent, 0);

    const totalSavingsRate = income ? 1 - nonSavingsSpent / income : 0;

    return {
      month: resolvedMonthId,
      income,
      buckets: bucketTotals,
      totalSavingsRate,
      remainingDays,
      periodStatus,
    };
  }
}
