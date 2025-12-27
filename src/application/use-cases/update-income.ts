import { Income } from "@/domain/income/income";
import { IncomeRepository, BudgetRepository } from "@/domain/repositories";
import { UpsertBudgetUseCase } from "./upsert-budget";

interface UpdateIncomeInput {
  id: string;
  name: string;
  amount: number;
}

export class UpdateIncomeUseCase {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly budgetRepository: BudgetRepository,
  ) {}

  async execute(input: UpdateIncomeInput): Promise<Income> {
    const income = await this.incomeRepository.update({
      id: input.id,
      name: input.name.trim(),
      amount: input.amount,
    });

    const total = await this.incomeRepository.getTotalForMonth(income.month);
    const upsertBudget = new UpsertBudgetUseCase(this.budgetRepository);
    await upsertBudget.execute({ month: income.month, income: total });

    return income;
  }
}
