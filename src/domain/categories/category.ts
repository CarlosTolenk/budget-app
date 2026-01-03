import { UserBucket, PresetBucketKey } from "@/domain/user-buckets/user-bucket";

export interface Category {
  id: string;
  userId: string;
  name: string;
  userBucketId: string;
  userBucket: UserBucket;
  bucket?: PresetBucketKey | null;
  idealMonthlyAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
