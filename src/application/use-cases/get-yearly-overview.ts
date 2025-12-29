import { IncomeRepository, TransactionRepository } from "@/domain/repositories";
import { format, parseISO, subMonths } from "date-fns";

export interface MonthlyOverview {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
}

export interface YearlyOverview {
  year: number;
  months: MonthlyOverview[];
}

interface GetYearlyOverviewInput {
  userId: string;
  monthsBack?: number;
  baseMonth?: string;
}

export class GetYearlyOverviewUseCase {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute({ userId, monthsBack = 6, baseMonth }: GetYearlyOverviewInput): Promise<YearlyOverview> {
    const anchor = baseMonth && /^\d{4}-\d{2}$/.test(baseMonth) ? parseISO(`${baseMonth}-01`) : new Date();
    const months: MonthlyOverview[] = [];

    for (let offset = monthsBack - 1; offset >= 0; offset--) {
      const date = subMonths(anchor, offset);
      const monthId = format(date, "yyyy-MM");
      const income = await this.incomeRepository.getTotalForMonth(monthId, userId);
      const transactions = await this.transactionRepository.findByMonth(monthId, userId);
      const expenses = transactions
        .filter((transaction) => transaction.amount < 0)
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

      months.push({ month: monthId, income, expenses });
    }

    return { year: anchor.getFullYear(), months };
  }
}
