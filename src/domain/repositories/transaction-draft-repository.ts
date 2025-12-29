import { CreateDraftInput, TransactionDraft } from "@/domain/transaction-drafts/transaction-draft";

export interface TransactionDraftRepository {
  listAll(userId: string): Promise<TransactionDraft[]>;
  create(input: CreateDraftInput): Promise<TransactionDraft>;
  delete(id: string, userId: string): Promise<void>;
  findByEmailMessageId(emailMessageId: string, userId: string): Promise<TransactionDraft | null>;
  findById(id: string, userId: string): Promise<TransactionDraft | null>;
}
