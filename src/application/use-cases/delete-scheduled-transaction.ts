import { ScheduledTransactionRepository } from "@/domain/repositories";

export class DeleteScheduledTransactionUseCase {
  constructor(private readonly scheduledTransactionRepository: ScheduledTransactionRepository) {}

  async execute(id: string): Promise<void> {
    await this.scheduledTransactionRepository.delete(id);
  }
}
