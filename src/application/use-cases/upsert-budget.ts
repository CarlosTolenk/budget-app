import { randomUUID } from "node:crypto";
import { format } from "date-fns";
import { BudgetRepository, UserBucketRepository } from "@/domain/repositories";
import { Budget } from "@/domain/budget/budget";
import { PresetBucketKey } from "@/domain/user-buckets/user-bucket";

export class UpsertBudgetUseCase {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly userBucketRepository: UserBucketRepository,
  ) {}

  async execute(input: { userId: string; month?: string; income: number }): Promise<Budget> {
    const month = input.month ?? format(new Date(), "yyyy-MM");
    const current = await this.budgetRepository.getByMonth(month, input.userId);
    const income = input.income;

    const targets = this.resolveTargets(income);
    const userBuckets = await this.userBucketRepository.listByUserId(input.userId);
    const bucketMap = new Map<PresetBucketKey, string>();
    userBuckets.forEach((bucket) => {
      if (bucket.presetKey) {
        bucketMap.set(bucket.presetKey, bucket.id);
      }
    });

    const buckets = (["NEEDS", "WANTS", "SAVINGS"] as PresetBucketKey[])
      .map((key) => {
        const userBucketId = bucketMap.get(key);
        if (!userBucketId) {
          return null;
        }
        return { userBucketId, targetAmount: targets[`${key.toLowerCase()}Target` as const] };
      })
      .filter((entry): entry is { userBucketId: string; targetAmount: number } => Boolean(entry));

    const budget = await this.budgetRepository.upsert({
      id: current?.id ?? randomUUID(),
      userId: current?.userId ?? input.userId,
      month,
      income,
      buckets,
    });

    return budget;
  }

  private resolveTargets(income: number) {
    return {
      needsTarget: Number((income * 0.5).toFixed(2)),
      wantsTarget: Number((income * 0.3).toFixed(2)),
      savingsTarget: Number((income * 0.2).toFixed(2)),
    };
  }
}
