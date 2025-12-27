import { IncomeRepository, BudgetRepository } from "@/domain/repositories";
import { UpsertBudgetUseCase } from "./upsert-budget";

export class DeleteIncomeUseCase {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly budgetRepository: BudgetRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.incomeRepository.delete(id);
    if (!deleted) {
      throw new Error("Ingreso no encontrado");
    }

    const total = await this.incomeRepository.getTotalForMonth(deleted.month);
    const upsertBudget = new UpsertBudgetUseCase(this.budgetRepository);
    await upsertBudget.execute({ month: deleted.month, income: total });
  }
}
