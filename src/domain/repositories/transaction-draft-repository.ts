import { CreateDraftInput, TransactionDraft } from "@/domain/transaction-drafts/transaction-draft";

export interface TransactionDraftRepository {
  listAll(): Promise<TransactionDraft[]>;
  create(input: CreateDraftInput): Promise<TransactionDraft>;
  delete(id: string): Promise<void>;
  findByEmailMessageId(emailMessageId: string): Promise<TransactionDraft | null>;
  findById(id: string): Promise<TransactionDraft | null>;
}
