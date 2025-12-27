import { TransactionDraftRepository } from "@/domain/repositories";

export class DeleteTransactionDraftUseCase {
  constructor(private readonly transactionDraftRepository: TransactionDraftRepository) {}

  async execute(id: string): Promise<void> {
    await this.transactionDraftRepository.delete(id);
  }
}
