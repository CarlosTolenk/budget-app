import { Income } from "@/domain/income/income";
import { IncomeRepository, BudgetRepository, UserBucketRepository } from "@/domain/repositories";
import { UpsertBudgetUseCase } from "./upsert-budget";

interface UpdateIncomeInput {
  userId: string;
  id: string;
  name: string;
  amount: number;
}

export class UpdateIncomeUseCase {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly budgetRepository: BudgetRepository,
    private readonly userBucketRepository: UserBucketRepository,
  ) {}

  async execute(input: UpdateIncomeInput): Promise<Income> {
    const income = await this.incomeRepository.update({
      id: input.id,
      userId: input.userId,
      name: input.name.trim(),
      amount: input.amount,
    });

    const total = await this.incomeRepository.getTotalForMonth(income.month, input.userId);
    const upsertBudget = new UpsertBudgetUseCase(this.budgetRepository, this.userBucketRepository);
    await upsertBudget.execute({ userId: input.userId, month: income.month, income: total });

    return income;
  }
}
