import { EmailMessage } from "../types/email-message";
import { TransactionSource } from "@/domain/transactions/transaction";
import { PresetBucketKey } from "@/domain/user-buckets/user-bucket";

export interface AdapterParsedTransaction {
  amount: number;
  currency: string;
  merchant: string;
  date: Date;
  bucket: PresetBucketKey;
  source: TransactionSource;
  emailMessageId: string;
  rawPayload?: Record<string, unknown>;
}

export interface BankAdapter {
  readonly name: string;
  matches(message: EmailMessage): boolean;
  parse(message: EmailMessage): AdapterParsedTransaction | null;
}
