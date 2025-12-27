import { IncomeRepository } from "@/domain/repositories";
import { Income } from "@/domain/income/income";
import { memoryIncomes } from "./memory-data";

export class MemoryIncomeRepository implements IncomeRepository {
  private incomes = [...memoryIncomes];

  async listByMonth(monthId: string): Promise<Income[]> {
    return this.incomes.filter((income) => income.month === monthId);
  }

  async create(input: { month: string; name: string; amount: number }): Promise<Income> {
    const income: Income = {
      id: `inc-${Math.random().toString(36).slice(2)}`,
      month: input.month,
      name: input.name,
      amount: input.amount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.incomes = [income, ...this.incomes];
    return income;
  }

  async update(input: { id: string; name: string; amount: number }): Promise<Income> {
    const index = this.incomes.findIndex((income) => income.id === input.id);
    if (index === -1) {
      throw new Error("Ingreso no encontrado");
    }
    const updated: Income = {
      ...this.incomes[index],
      name: input.name,
      amount: input.amount,
      updatedAt: new Date(),
    };
    this.incomes[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<Income | null> {
    const index = this.incomes.findIndex((income) => income.id === id);
    if (index === -1) {
      return null;
    }
    const [removed] = this.incomes.splice(index, 1);
    return removed;
  }

  async getTotalForMonth(monthId: string): Promise<number> {
    return this.incomes
      .filter((income) => income.month === monthId)
      .reduce((sum, income) => sum + income.amount, 0);
  }
}
