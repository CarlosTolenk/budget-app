import { format } from "date-fns";
import { Income } from "@/domain/income/income";
import { IncomeRepository } from "@/domain/repositories";

export class ListIncomesUseCase {
  constructor(private readonly incomeRepository: IncomeRepository) {}

  async execute(monthId?: string): Promise<Income[]> {
    const resolved = monthId ?? format(new Date(), "yyyy-MM");
    return this.incomeRepository.listByMonth(resolved);
  }
}
