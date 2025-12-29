import { TransactionDraftRepository } from "@/domain/repositories";
import { CreateDraftInput, TransactionDraft } from "@/domain/transaction-drafts/transaction-draft";
import { memoryDrafts } from "./memory-data";

export class MemoryTransactionDraftRepository implements TransactionDraftRepository {
  private data = [...memoryDrafts];

  async listAll(userId: string): Promise<TransactionDraft[]> {
    return this.data.filter((draft) => draft.userId === userId);
  }

  async create(input: CreateDraftInput): Promise<TransactionDraft> {
    const draft: TransactionDraft = {
      id: `draft-${Math.random().toString(36).slice(2)}`,
      userId: input.userId,
      amount: input.amount,
      bucket: input.bucket,
      categoryId: input.categoryId,
      createdAt: new Date(),
      currency: input.currency,
      date: input.date,
      emailMessageId: input.emailMessageId,
      merchant: input.merchant,
      rawPayload: input.rawPayload,
      source: input.source,
      updatedAt: new Date(),
    };
    this.data = [draft, ...this.data];
    return draft;
  }

  async delete(id: string, userId: string): Promise<void> {
    this.data = this.data.filter((draft) => !(draft.id === id && draft.userId === userId));
  }

  async findByEmailMessageId(emailMessageId: string, userId: string): Promise<TransactionDraft | null> {
    return this.data.find((draft) => draft.userId === userId && draft.emailMessageId === emailMessageId) ?? null;
  }

  async findById(id: string, userId: string): Promise<TransactionDraft | null> {
    return this.data.find((draft) => draft.userId === userId && draft.id === id) ?? null;
  }
}
