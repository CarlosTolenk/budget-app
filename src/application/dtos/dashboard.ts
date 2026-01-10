import { PresetBucketKey, UserBucket } from "@/domain/user-buckets/user-bucket";

export interface BucketProgress {
  bucketId: string;
  presetKey?: PresetBucketKey | null;
  bucketDetails: UserBucket;
  spent: number;
  target: number;
  planned: number;
  targetRatio?: number | null;
}

export interface DashboardSummary {
  month: string;
  income: number;
  buckets: BucketProgress[];
  totalSavingsRate: number;
  remainingDays: number;
  periodStatus: "past" | "current" | "future";
}
