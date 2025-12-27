import { Bucket } from "@/domain/value-objects/bucket";

export type ScheduledRecurrence = "MONTHLY";

export interface ScheduledTransaction {
  id: string;
  name: string;
  amount: number;
  currency: string;
  merchant?: string | null;
  bucket: Bucket;
  categoryId?: string | null;
  recurrence: ScheduledRecurrence;
  startDate: Date;
  nextRunDate: Date;
  endDate?: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduledTransactionInput {
  name: string;
  amount: number;
  currency: string;
  merchant?: string;
  bucket: Bucket;
  categoryId?: string;
  recurrence: ScheduledRecurrence;
  startDate: Date;
}
