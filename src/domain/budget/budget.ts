import { UserBucket } from "@/domain/user-buckets/user-bucket";

export interface Budget {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  income: number;
  createdAt: Date;
  updatedAt: Date;
  buckets: BudgetBucket[];
}

export interface BudgetBucket {
  id: string;
  budgetId: string;
  userBucketId: string;
  userBucket: UserBucket;
  targetAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BucketAllocation {
  userBucketId: string;
  userBucket: UserBucket;
  target: number;
  planned: number;
  spent: number;
}
