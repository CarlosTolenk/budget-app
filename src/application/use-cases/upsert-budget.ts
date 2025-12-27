import { randomUUID } from "node:crypto";
import { format } from "date-fns";
import { BudgetRepository } from "@/domain/repositories";
import { Budget } from "@/domain/budget/budget";

export class UpsertBudgetUseCase {
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(input: { month?: string; income: number }): Promise<Budget> {
    const month = input.month ?? format(new Date(), "yyyy-MM");
    const current = await this.budgetRepository.getByMonth(month);
    const income = input.income;

    const targets = this.resolveTargets(income);

    const budget: Budget = {
      id: current?.id ?? randomUUID(),
      month,
      income,
      needsTarget: targets.needsTarget,
      wantsTarget: targets.wantsTarget,
      savingsTarget: targets.savingsTarget,
      createdAt: current?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    await this.budgetRepository.upsert(budget);
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
