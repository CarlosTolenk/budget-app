import { TransactionDraft } from "@/domain/transaction-drafts/transaction-draft";
import { TransactionDraftRepository } from "@/domain/repositories";

export class ListTransactionDraftsUseCase {
  constructor(private readonly transactionDraftRepository: TransactionDraftRepository) {}

  async execute(): Promise<TransactionDraft[]> {
    const drafts = await this.transactionDraftRepository.listAll();

    return drafts
      .slice()
      .sort((a, b) => {
        const dateDiff = b.date.getTime() - a.date.getTime();
        if (dateDiff !== 0) {
          return dateDiff;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
}
