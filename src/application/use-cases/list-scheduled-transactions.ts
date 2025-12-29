import { ScheduledTransaction } from "@/domain/scheduled-transactions/scheduled-transaction";
import { ScheduledTransactionRepository } from "@/domain/repositories";

export class ListScheduledTransactionsUseCase {
  constructor(private readonly scheduledTransactionRepository: ScheduledTransactionRepository) {}

  async execute(userId: string): Promise<ScheduledTransaction[]> {
    return this.scheduledTransactionRepository.listAll(userId);
  }
}
