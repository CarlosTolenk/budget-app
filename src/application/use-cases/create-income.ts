import { format } from "date-fns";
import { Income } from "@/domain/income/income";
import { IncomeRepository, BudgetRepository, UserBucketRepository } from "@/domain/repositories";
import { UpsertBudgetUseCase } from "./upsert-budget";

interface CreateIncomeInput {
  userId: string;
  month?: string;
  name: string;
  amount: number;
}

export class CreateIncomeUseCase {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly budgetRepository: BudgetRepository,
    private readonly userBucketRepository: UserBucketRepository,
  ) {}

  async execute(input: CreateIncomeInput): Promise<Income> {
    const month = input.month ?? format(new Date(), "yyyy-MM");
    const income = await this.incomeRepository.create({
      userId: input.userId,
      month,
      name: input.name.trim(),
      amount: input.amount,
    });
    const total = await this.incomeRepository.getTotalForMonth(month, input.userId);

    const upsertBudget = new UpsertBudgetUseCase(this.budgetRepository, this.userBucketRepository);
    await upsertBudget.execute({ userId: input.userId, month, income: total });

    return income;
  }
}
