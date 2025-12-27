import { BudgetRepository } from "@/domain/repositories";
import { Budget } from "@/domain/budget/budget";
import { memoryBudget } from "./memory-data";

export class MemoryBudgetRepository implements BudgetRepository {
  private budget = memoryBudget;

  async getByMonth(monthId: string): Promise<Budget | null> {
    return this.budget.month === monthId ? this.budget : null;
  }

  async upsert(budget: Budget): Promise<void> {
    this.budget = budget;
  }
}
