import { Bucket } from "@/domain/value-objects/bucket";

export interface BucketProgress {
  bucket: Bucket;
  spent: number;
  target: number;
  targetRatio: number;
}

export interface DashboardSummary {
  month: string;
  income: number;
  buckets: BucketProgress[];
  totalSavingsRate: number;
  remainingDays: number;
  periodStatus: "past" | "current" | "future";
}
