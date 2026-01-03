import { BudgetRepository } from "@/domain/repositories";
import { Budget } from "@/domain/budget/budget";
import { memoryBudget, memoryBuckets } from "./memory-data";

export class MemoryBudgetRepository implements BudgetRepository {
  private budget = memoryBudget;

  async getByMonth(monthId: string, userId: string): Promise<Budget | null> {
    return this.budget.month === monthId && this.budget.userId === userId ? this.budget : null;
  }

  async upsert(input: {
    id?: string;
    userId: string;
    month: string;
    income: number;
    buckets: Array<{ userBucketId: string; targetAmount: number }>;
  }): Promise<Budget> {
    const now = new Date();
    const existing = this.budget?.month === input.month && this.budget?.userId === input.userId ? this.budget : null;
    const budgetId = input.id ?? existing?.id ?? `budget-${Math.random().toString(36).slice(2)}`;
    const bucketEntries = input.buckets.map((bucket) => {
      const userBucket = this.resolveBucket(bucket.userBucketId, input.userId);
      return {
        id: `budget-bucket-${Math.random().toString(36).slice(2)}`,
        budgetId,
        userBucketId: userBucket.id,
        userBucket,
        targetAmount: bucket.targetAmount,
        createdAt: now,
        updatedAt: now,
      };
    });
    const budget: Budget = {
      id: budgetId,
      userId: input.userId,
      month: input.month,
      income: input.income,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      buckets: bucketEntries,
    };
    this.budget = budget;
    return budget;
  }

  private resolveBucket(userBucketId: string, userId: string) {
    const bucket = memoryBuckets.find((entry) => entry.id === userBucketId && entry.userId === userId);
    if (!bucket) {
      throw new Error("Bucket no encontrado");
    }
    return bucket;
  }
}
