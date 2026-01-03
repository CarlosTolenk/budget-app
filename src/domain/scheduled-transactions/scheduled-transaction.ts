import { UserBucket, PresetBucketKey } from "@/domain/user-buckets/user-bucket";

export type ScheduledRecurrence = "MONTHLY";

export interface ScheduledTransaction {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  merchant?: string | null;
  userBucketId: string;
  userBucket: UserBucket;
  bucket?: PresetBucketKey | null;
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
  userId: string;
  name: string;
  amount: number;
  currency: string;
  merchant?: string;
  userBucketId: string;
  categoryId?: string;
  recurrence: ScheduledRecurrence;
  startDate: Date;
}
