import { UserBucket, PresetBucketKey } from "@/domain/user-buckets/user-bucket";

export type TransactionSource = "EMAIL" | "MANUAL" | "SCHEDULED";

export interface Transaction {
  id: string;
  userId: string;
  date: Date;
  amount: number;
  currency: string;
  merchant?: string | null;
  categoryId?: string | null;
  userBucketId: string;
  userBucket: UserBucket;
  bucket?: PresetBucketKey | null;
  source: TransactionSource;
  emailMessageId?: string | null;
  rawPayload?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionInput {
  id?: string;
  userId: string;
  date: Date;
  amount: number;
  currency: string;
  merchant?: string;
  categoryId?: string;
  userBucketId: string;
  source: TransactionSource;
  emailMessageId?: string;
  rawPayload?: Record<string, unknown> | null;
}
