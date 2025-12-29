import { Bucket } from "@/domain/value-objects/bucket";

export interface TransactionDraft {
  id: string;
  userId: string;
  date: Date;
  amount: number;
  currency: string;
  merchant?: string | null;
  bucket: Bucket;
  categoryId?: string | null;
  emailMessageId?: string | null;
  rawPayload?: Record<string, unknown> | null;
  source?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDraftInput {
  userId: string;
  date: Date;
  amount: number;
  currency: string;
  merchant?: string;
  bucket: Bucket;
  categoryId?: string;
  emailMessageId?: string;
  rawPayload?: Record<string, unknown> | null;
  source?: string | null;
}
