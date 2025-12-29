import { IncomeRepository, BudgetRepository } from "@/domain/repositories";
import { UpsertBudgetUseCase } from "./upsert-budget";

export class DeleteIncomeUseCase {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly budgetRepository: BudgetRepository,
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    const deleted = await this.incomeRepository.delete(id, userId);
    if (!deleted) {
      throw new Error("Ingreso no encontrado");
    }

    const total = await this.incomeRepository.getTotalForMonth(deleted.month, userId);
    const upsertBudget = new UpsertBudgetUseCase(this.budgetRepository);
    await upsertBudget.execute({ userId, month: deleted.month, income: total });
  }
}
