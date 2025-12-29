import { ScheduledTransactionRepository } from "@/domain/repositories";

export class DeleteScheduledTransactionUseCase {
  constructor(private readonly scheduledTransactionRepository: ScheduledTransactionRepository) {}

  async execute(userId: string, id: string): Promise<void> {
    await this.scheduledTransactionRepository.delete(id, userId);
  }
}
