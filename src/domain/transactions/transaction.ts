import { Bucket } from "../value-objects/bucket";

export type TransactionSource = "EMAIL" | "MANUAL" | "SCHEDULED";

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  merchant?: string | null;
  categoryId?: string | null;
  bucket: Bucket;
  source: TransactionSource;
  emailMessageId?: string | null;
  rawPayload?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionInput {
  id?: string;
  date: Date;
  amount: number;
  currency: string;
  merchant?: string;
  categoryId?: string;
  bucket: Bucket;
  source: TransactionSource;
  emailMessageId?: string;
  rawPayload?: Record<string, unknown> | null;
}
