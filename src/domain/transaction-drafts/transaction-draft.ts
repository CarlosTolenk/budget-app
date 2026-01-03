import { UserBucket, PresetBucketKey } from "@/domain/user-buckets/user-bucket";

export interface TransactionDraft {
  id: string;
  userId: string;
  date: Date;
  amount: number;
  currency: string;
  merchant?: string | null;
  userBucketId: string;
  userBucket: UserBucket;
  bucket?: PresetBucketKey | null;
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
  userBucketId: string;
  categoryId?: string;
  emailMessageId?: string;
  rawPayload?: Record<string, unknown> | null;
  source?: string | null;
}
