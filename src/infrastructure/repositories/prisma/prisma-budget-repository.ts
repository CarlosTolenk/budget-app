import { BudgetRepository } from "@/domain/repositories";
import { Budget } from "@/domain/budget/budget";
import { prisma } from "@/infrastructure/db/prisma-client";

export class PrismaBudgetRepository implements BudgetRepository {
  async getByMonth(monthId: string, userId: string): Promise<Budget | null> {
    const record = await prisma.budget.findUnique({ where: { userId_month: { userId, month: monthId } } });
    if (!record) {
      return null;
    }

    return {
      id: record.id,
      userId: record.userId,
      income: Number(record.income),
      month: record.month,
      needsTarget: Number(record.needsTarget),
      wantsTarget: Number(record.wantsTarget),
      savingsTarget: Number(record.savingsTarget),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async upsert(budget: Budget): Promise<void> {
    await prisma.budget.upsert({
      where: { userId_month: { userId: budget.userId, month: budget.month } },
      update: {
        income: budget.income,
        needsTarget: budget.needsTarget,
        wantsTarget: budget.wantsTarget,
        savingsTarget: budget.savingsTarget,
      },
      create: {
        id: budget.id,
        userId: budget.userId,
        month: budget.month,
        income: budget.income,
        needsTarget: budget.needsTarget,
        wantsTarget: budget.wantsTarget,
        savingsTarget: budget.savingsTarget,
      },
    });
  }
}
