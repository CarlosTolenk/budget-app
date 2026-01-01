import { format } from "date-fns";
import { TransactionRepository } from "@/domain/repositories";
import { Transaction } from "@/domain/transactions/transaction";

interface ListTransactionsInput {
  userId: string;
  monthId?: string;
  limit?: number;
  scope?: "month" | "all";
}

export class ListTransactionsUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute({ userId, monthId, limit, scope = "month" }: ListTransactionsInput): Promise<Transaction[]> {
    if (limit) {
      return this.transactionRepository.findRecent(limit, userId);
    }

    if (scope === "all") {
      return this.transactionRepository.findAll(userId);
    }

    const resolvedMonthId = monthId ?? format(new Date(), "yyyy-MM");
    return this.transactionRepository.findByMonth(resolvedMonthId, userId);
  }
}
