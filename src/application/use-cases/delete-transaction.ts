import { TransactionRepository } from "@/domain/repositories";

export class DeleteTransactionUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(userId: string, id: string): Promise<void> {
    if (!id) {
      throw new Error("Missing transaction id");
    }

    await this.transactionRepository.delete(id, userId);
  }
}
