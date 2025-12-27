import { CreateScheduledTransactionInput, ScheduledTransaction } from "@/domain/scheduled-transactions/scheduled-transaction";
import { ScheduledTransactionRepository } from "@/domain/repositories";

export class CreateScheduledTransactionUseCase {
  constructor(private readonly scheduledTransactionRepository: ScheduledTransactionRepository) {}

  async execute(input: CreateScheduledTransactionInput): Promise<ScheduledTransaction> {
    return this.scheduledTransactionRepository.create(input);
  }
}
