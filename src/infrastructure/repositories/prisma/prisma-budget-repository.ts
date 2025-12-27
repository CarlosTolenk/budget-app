import { BudgetRepository } from "@/domain/repositories";
import { Budget } from "@/domain/budget/budget";
import { prisma } from "@/infrastructure/db/prisma-client";

export class PrismaBudgetRepository implements BudgetRepository {
  async getByMonth(monthId: string): Promise<Budget | null> {
    const record = await prisma.budget.findUnique({ where: { month: monthId } });
    if (!record) {
      return null;
    }

    return {
      id: record.id,
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
      where: { id: budget.id },
      update: budget,
      create: budget,
    });
  }
}
