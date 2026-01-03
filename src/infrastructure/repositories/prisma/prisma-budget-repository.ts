import { BudgetRepository } from "@/domain/repositories";
import { Budget } from "@/domain/budget/budget";
import { prisma } from "@/infrastructure/db/prisma-client";

export class PrismaBudgetRepository implements BudgetRepository {
  async getByMonth(monthId: string, userId: string): Promise<Budget | null> {
    const record = await prisma.budget.findUnique({
      where: { userId_month: { userId, month: monthId } },
      include: { buckets: { include: { userBucket: true } } },
    });
    if (!record) {
      return null;
    }

    return this.mapBudget(record);
  }

  async upsert(input: {
    id?: string;
    userId: string;
    month: string;
    income: number;
    buckets: Array<{ userBucketId: string; targetAmount: number }>;
  }): Promise<Budget> {
    await prisma.$transaction(async (tx) => {
      const budgetRecord = await tx.budget.upsert({
        where: { userId_month: { userId: input.userId, month: input.month } },
        update: {
          income: input.income,
        },
        create: {
          id: input.id,
          userId: input.userId,
          month: input.month,
          income: input.income,
        },
      });

      await tx.budgetBucket.deleteMany({ where: { budgetId: budgetRecord.id } });
      if (input.buckets.length) {
        await tx.budgetBucket.createMany({
          data: input.buckets.map((bucket) => ({
            budgetId: budgetRecord.id,
            userBucketId: bucket.userBucketId,
            targetAmount: bucket.targetAmount,
          })),
        });
      }
    });

    const updated = await this.getByMonth(input.month, input.userId);
    if (!updated) {
      throw new Error("Failed to obtain updated budget");
    }
    return updated;
  }

  private mapBudget(record: {
    id: string;
    userId: string;
    income: unknown;
    month: string;
    createdAt: Date;
    updatedAt: Date;
    buckets: Array<{
      id: string;
      budgetId: string;
      userBucketId: string;
      targetAmount: unknown;
      createdAt: Date;
      updatedAt: Date;
      userBucket: {
        id: string;
        userId: string;
        name: string;
        sortOrder: number;
        color: string | null;
        mode: "PRESET" | "CUSTOM";
        presetKey: "NEEDS" | "WANTS" | "SAVINGS" | null;
        createdAt: Date;
        updatedAt: Date;
      };
    }>;
  }): Budget {
    return {
      id: record.id,
      userId: record.userId,
      income: Number(record.income),
      month: record.month,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      buckets: record.buckets.map((entry) => ({
        id: entry.id,
        budgetId: entry.budgetId,
        userBucketId: entry.userBucketId,
        userBucket: {
          id: entry.userBucket.id,
          userId: entry.userBucket.userId,
          name: entry.userBucket.name,
          sortOrder: entry.userBucket.sortOrder,
          color: entry.userBucket.color,
          mode: entry.userBucket.mode,
          presetKey: entry.userBucket.presetKey,
          createdAt: entry.userBucket.createdAt,
          updatedAt: entry.userBucket.updatedAt,
        },
        targetAmount: Number(entry.targetAmount),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      })),
    };
  }
}
